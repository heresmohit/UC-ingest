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

// Index of the "}" that closes the "{" at `start`, skipping over string
// literals (so braces inside strings don't throw off the depth count).
function matchBrace(s, start) {
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      i++;
      while (i < s.length && s[i] !== '"') {
        if (s[i] === "\\") i++;
        i++;
      }
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      if (--depth === 0) return i;
    }
  }
  return -1;
}

// Widen outward from `pos` to the smallest enclosing object that parses and
// carries the fields we need (name + event_state + venue.shows). That object is
// District's getBySlug ".data" payload, embedded verbatim in the page.
function extractEventObject(s, pos) {
  let start = s.lastIndexOf("{", pos);
  while (start !== -1) {
    const end = matchBrace(s, start);
    if (end !== -1) {
      try {
        const obj = JSON.parse(s.slice(start, end + 1));
        if (obj?.name && obj?.event_state && Array.isArray(obj?.venue?.shows)) {
          return obj;
        }
      } catch {
        // not balanced/valid from here; widen to the next enclosing brace
      }
    }
    start = s.lastIndexOf("{", start - 1);
  }
  return null;
}

// RSC streams large strings (like the HTML description) as their own flight row
// — "<id>:T<hexlen>,<utf8 text>" — and references them elsewhere as "$<id>". A
// field whose value is such a reference must be resolved against its row. Length
// is in bytes, so slice on a Buffer to stay correct through multi-byte chars.
function resolveFlightString(flight, value) {
  if (typeof value !== "string" || !/^\$[0-9a-f]+$/.test(value)) return value;
  const id = value.slice(1);
  // Length-prefixed (T) rows aren't newline-delimited, so anchor on a non-hex
  // boundary before the id rather than a line start; the type char follows ":".
  const decl = flight.match(new RegExp("(?:^|[^0-9a-f])" + id + ":"));
  if (!decl) return null;
  const at = decl.index + decl[0].length; // index of the type char
  if (flight[at] === "T") {
    const comma = flight.indexOf(",", at);
    const len = parseInt(flight.slice(at + 1, comma), 16);
    if (!Number.isFinite(len)) return null;
    return Buffer.from(flight.slice(comma + 1), "utf8").slice(0, len).toString("utf8");
  }
  if (flight[at] === '"') {
    const m = flight.slice(at).match(/^"((?:[^"\\]|\\.)*)"/);
    return m ? JSON.parse(m[0]) : null;
  }
  return null;
}

// Recover District's event payload from the public event page. The page is a
// Next.js App Router route that streams its data as RSC flight chunks via
// self.__next_f.push([1,"<chunk>"]); concatenating the chunks reconstitutes the
// JSON that the geoblocked getBySlug API would have returned as ".data".
function parseDistrictPage(html) {
  let flight = "";
  const chunkRe = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = chunkRe.exec(html))) {
    try {
      flight += JSON.parse('"' + m[1] + '"');
    } catch {
      // skip a malformed chunk rather than abandon the whole page
    }
  }
  const anchor = flight.indexOf('"start_utc_timestamp"');
  if (anchor === -1) return null; // no shows embedded -> no usable event
  const data = extractEventObject(flight, anchor);
  if (!data) return null;
  // String fields we consume may be flight references rather than inline text.
  for (const key of ["name", "description", "cover_image"]) {
    data[key] = resolveFlightString(flight, data[key]);
  }
  return data;
}

// District descriptions are HTML with block tags (<p>, <br>) rather than the
// newlines Discourse uses, and they end with the same "Who are Improv Lore?"
// troupe boilerplate but wrapped in <p><strong> instead of an <h> heading, so
// the shared stripHtml cannot catch it. Strip the boilerplate, turn block tags
// into newlines, then drop the rest.
function stripDistrictHtml(html) {
  if (!html) return null;
  const text = html
    // Drop the trailing troupe blurb (everything from the heading onward).
    .replace(/<p>\s*<strong>\s*Who are Improv\s?Lore\?[\s\S]*$/i, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return text || null;
}

// Collapse District's per-show timestamps (epoch seconds) into one start/end
// ISO window. Returns endTs (epoch s) so callers can drop finished events —
// District does not flip event_state for past events, so the date is the only
// reliable signal.
function districtShowWindow(data) {
  const shows = data?.venue?.shows ?? [];
  let min = Infinity;
  let max = -Infinity;
  for (const s of shows) {
    if (s.is_hidden) continue;
    const start = Number(s.start_utc_timestamp);
    const end = Number(s.end_utc_timestamp);
    if (Number.isFinite(start)) min = Math.min(min, start);
    if (Number.isFinite(end)) max = Math.max(max, end);
  }
  if (!Number.isFinite(min)) return null;
  const endTs = Number.isFinite(max) ? max : min;
  return {
    startsAt: new Date(min * 1000).toISOString(),
    endsAt: Number.isFinite(max) ? new Date(max * 1000).toISOString() : null,
    endTs,
  };
}

// Map a District getBySlug payload into our event shape (matches buildEvent).
// tags must include "UC" (the website only renders UC-tagged events) and the
// url must be a district.in/.../event link so the site's live ticket button
// keys off it.
function buildDistrictEvent(data, slug, win) {
  const description = stripDistrictHtml(data.description);
  // District titles can carry stray leading/trailing/doubled whitespace that
  // Discourse titles never do; normalise so slugs and display stay clean.
  const title = (data.name ?? "").replace(/\s+/g, " ").trim() || null;
  return {
    title,
    author: null,
    excerpt: description,
    full_content: description,
    image_url: data.cover_image ?? null,
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

  const nowTs = Date.now() / 1000;
  const bySlug = new Map();
  // Outcome tally so a CI log makes the failure mode obvious at a glance:
  // fetch_failed = non-2xx (a 403/451 here is the geoblock); parse_miss = page
  // came back but had no event payload (format change, or a 200 block page).
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

    const data = parseDistrictPage(html);
    if (!data) {
      tally.parse_miss++;
      console.warn(
        `  District [parse_miss] ${slug}: no event payload in ${html.length}-char page`
      );
      continue;
    }
    if (!DISTRICT_SHOWABLE.has(data.event_state)) {
      tally.not_showable++;
      console.log(`  District [not_showable] ${slug}: state=${data.event_state}`);
      continue;
    }

    const win = districtShowWindow(data);
    if (!win) {
      tally.no_date++;
      console.log(`  District [no_date] ${slug}: no usable show timestamps`);
      continue;
    }
    if (win.endTs < nowTs) {
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
