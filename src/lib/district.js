import {
  VENUE,
  DISTRICT_SITEMAP,
  DISTRICT_SHOWABLE,
  districtEventPageUrl,
} from "./config.js";
import { fetchText } from "./http.js";
import { getEventTags } from "./discourse.js";

// All District getBySlug-slugs whose sitemap URL matches one of `matchTerms`.
// Sitemap entries look like ".../events/<slug>-buy-tickets".
async function fetchDistrictSlugs(matchTerms) {
  const terms = matchTerms.map((t) => t.toLowerCase());
  const xml = await fetchText(DISTRICT_SITEMAP);
  const slugs = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) {
    const loc = m[1];
    const blob = loc.toLowerCase().replace(/-/g, " ");
    if (!terms.some((t) => blob.includes(t))) continue;
    const path = loc.split("/").filter(Boolean).pop() || "";
    const slug = path.replace(/-buy-tickets$/, "");
    if (slug) slugs.push(slug);
  }
  return slugs;
}

// All schema.org Event objects from the page's JSON-LD blocks, in document
// order. District embeds one Event block per upcoming date on the same page
// for a recurring show (e.g. weekly/monthly repeats of the same event), plus
// other non-Event blocks (BreadcrumbList, etc.) we ignore. A single-date show
// simply yields a one-element array.
function extractEventLds(html) {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  const events = [];
  let m;
  while ((m = re.exec(html))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue; // malformed block; try the next one
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (item?.["@type"] === "Event") events.push(item);
    }
  }
  return events;
}

// JSON-LD descriptions are already plain text (District strips the HTML), but
// they end with the same "Who Are Improv Lore?" troupe boilerplate the
// Discourse posts carry; drop it.
function cleanDescription(text) {
  if (!text) return null;
  const cleaned = text
    .replace(/Who Are Improv\s?Lore\?[\s\S]*$/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return cleaned || null;
}

// Start/end window from the JSON-LD dates, normalised to ISO. Returns endTs
// (epoch ms) so callers can drop finished events — District keeps past events
// EventScheduled, so the date is the only reliable signal.
function eventWindow(data) {
  const start = new Date(data.startDate ?? "");
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(data.endDate ?? "");
  const hasEnd = !Number.isNaN(end.getTime());
  return {
    startsAt: start.toISOString(),
    endsAt: hasEnd ? end.toISOString() : null,
    endTs: hasEnd ? end.getTime() : start.getTime(),
  };
}

// Map a District JSON-LD Event into our event shape (matches buildEvent).
// tags must include "UC" (the website only renders UC-tagged events) and the
// url must be a district.in/.../event link so the site's live ticket button
// keys off it. `slug` is the page's sitemap slug (shared by every date on a
// recurring show — used for the real url/learn_more, since District serves
// one page per show regardless of date count); `key` is the per-date identity
// used only as this map's key, so multiple dates from the same page don't
// collide.
function buildDistrictEvent(data, slug, key, win) {
  const description = cleanDescription(data.description);
  // District titles can carry stray leading/trailing/doubled whitespace that
  // Discourse titles never do; normalise so slugs and display stay clean.
  const title = (data.name ?? "").replace(/\s+/g, " ").trim() || null;
  return {
    title,
    author: null,
    excerpt: description,
    full_content: description,
    image_url: data.image ?? null,
    event_starts_at: win.startsAt,
    event_ends_at: win.endsAt,
    slug: key,
    url: `https://district.in/${slug}/event`,
    learn_more: `https://www.district.in/events/${slug}-buy-tickets`,
    venue: VENUE,
    tags: getEventTags(title ?? "", description),
  };
}

// Fetch every showable Improv Lore event listed on District, keyed by its
// District slug. Opt-in via community.district. This is both the discovery
// source (events not on Discourse) and the override source (District is the
// ticketing system, so its date/time is authoritative on conflict). The caller
// decides how to merge; see mergeDistrict.
export async function loadDistrictEvents(community) {
  const cfg = community.district;
  if (!cfg) return new Map();

  let slugs;
  try {
    slugs = await fetchDistrictSlugs(cfg.match);
  } catch (err) {
    console.warn(`  District sitemap fetch failed: ${err.message}`);
    return new Map();
  }
  console.log(
    `  District: matched ${slugs.length} sitemap slug(s) for [${cfg.match.join(", ")}]`
  );

  const now = Date.now();
  const bySlug = new Map();
  // Outcome tally so a CI log makes the failure mode obvious at a glance:
  // fetch_failed = non-2xx (a 403/451 here is the geoblock); parse_miss = page
  // came back but had no Event JSON-LD (format change, or a 200 block page).
  const tally = {
    kept: 0,
    fetch_failed: 0,
    parse_miss: 0,
    not_showable: 0,
    no_date: 0,
    past: 0,
    multi_date_pages: 0,
  };

  for (const slug of slugs) {
    let html;
    try {
      html = await fetchText(districtEventPageUrl(slug));
    } catch (err) {
      tally.fetch_failed++;
      console.warn(`  District [fetch_failed] ${slug}: ${err.message}`);
      continue;
    }

    const events = extractEventLds(html);
    if (events.length === 0) {
      tally.parse_miss++;
      console.warn(
        `  District [parse_miss] ${slug}: no Event JSON-LD in ${html.length}-char page`
      );
      continue;
    }
    if (events.length > 1) {
      tally.multi_date_pages++;
      console.log(`  District [multi_date] ${slug}: ${events.length} dates on one page`);
    }

    // One page can list several upcoming dates for the same recurring show;
    // each date is its own entry, keyed uniquely so they don't collide, while
    // url/learn_more (built from `slug`, not `key`) still point at the one
    // real District page shared by every date.
    for (const data of events) {
      if (!DISTRICT_SHOWABLE.has(data.eventStatus)) {
        tally.not_showable++;
        console.log(`  District [not_showable] ${slug}: status=${data.eventStatus}`);
        continue;
      }

      const win = eventWindow(data);
      if (!win) {
        tally.no_date++;
        console.log(`  District [no_date] ${slug}: no usable start date`);
        continue;
      }
      if (win.endTs < now) {
        tally.past++;
        console.log(`  District [past] ${slug}: ended ${win.endsAt ?? win.startsAt}`);
        continue;
      }

      const dateStamp = win.startsAt.slice(0, 10).replace(/-/g, "");
      const key = `${slug}-${dateStamp}`;
      tally.kept++;
      console.log(`  District [kept] ${key}: "${data.name}" @ ${win.startsAt}`);
      bySlug.set(key, buildDistrictEvent(data, slug, key, win));
    }
  }

  console.log(
    `  District summary: kept=${tally.kept} fetch_failed=${tally.fetch_failed} ` +
      `parse_miss=${tally.parse_miss} not_showable=${tally.not_showable} ` +
      `no_date=${tally.no_date} past=${tally.past} multi_date_pages=${tally.multi_date_pages}`
  );
  return bySlug;
}
