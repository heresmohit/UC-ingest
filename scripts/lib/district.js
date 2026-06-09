import {
  VENUE,
  DISTRICT_API,
  DISTRICT_SITEMAP,
  DISTRICT_SHOWABLE,
} from "./config.js";
import { fetchJson, fetchText } from "./http.js";
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

  const nowTs = Date.now() / 1000;
  const bySlug = new Map();

  for (const slug of slugs) {
    let data;
    try {
      const json = await fetchJson(DISTRICT_API + encodeURIComponent(slug));
      data = json?.data;
    } catch (err) {
      console.warn(`  Skipping District "${slug}": ${err.message}`);
      continue;
    }
    if (!data || !DISTRICT_SHOWABLE.has(data.event_state)) continue;

    const win = districtShowWindow(data);
    if (!win) continue; // no usable date
    if (win.endTs < nowTs) continue; // already over (state is unreliable)

    bySlug.set(slug, buildDistrictEvent(data, slug, win));
  }

  return bySlug;
}
