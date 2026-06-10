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

// The schema.org Event object from the page's JSON-LD blocks, or null. District
// embeds one per event page for SEO; a block may be a single object or an array.
function extractEventLd(html) {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue; // malformed block; try the next one
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const event = items.find((d) => d?.["@type"] === "Event");
    if (event) return event;
  }
  return null;
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
// keys off it.
function buildDistrictEvent(data, slug, win) {
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
    slug,
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
  const tally = { kept: 0, fetch_failed: 0, parse_miss: 0, not_showable: 0, no_date: 0, past: 0 };

  for (const slug of slugs) {
    let html;
    try {
      html = await fetchText(districtEventPageUrl(slug));
    } catch (err) {
      tally.fetch_failed++;
      console.warn(`  District [fetch_failed] ${slug}: ${err.message}`);
      continue;
    }

    const data = extractEventLd(html);
    if (!data) {
      tally.parse_miss++;
      console.warn(
        `  District [parse_miss] ${slug}: no Event JSON-LD in ${html.length}-char page`
      );
      continue;
    }
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

    tally.kept++;
    console.log(`  District [kept] ${slug}: "${data.name}" @ ${win.startsAt}`);
    bySlug.set(slug, buildDistrictEvent(data, slug, win));
  }

  console.log(
    `  District summary: kept=${tally.kept} fetch_failed=${tally.fetch_failed} ` +
      `parse_miss=${tally.parse_miss} not_showable=${tally.not_showable} ` +
      `no_date=${tally.no_date} past=${tally.past}`
  );
  return bySlug;
}
