import { d1Query } from "./d1.js";
import { normTitle } from "./merge.js";

/**
 * Applies Cloudflare D1 admin overrides (managed via improvlore.com/admin)
 * onto ingested events. If an event occurrence has been disabled
 * (display_enabled = 0) or cancelled, it is dropped. If any display_* fields
 * were modified by an admin, they override the raw ingested values.
 */
export async function applyD1Overrides(events, communityName = "improvlore") {
  let rows;
  try {
    rows = await d1Query(
      `SELECT slug, normalized_title, display_title, display_author, display_excerpt,
              display_full_content, display_image_url, display_event_starts_at,
              display_event_ends_at, display_venue, display_url, display_learn_more,
              display_tags, display_enabled, occurrence_status, last_edited_at
       FROM events
       WHERE community = ?`,
      [communityName]
    );
  } catch (err) {
    // Graceful degradation when D1 is not configured/offline
    console.log(`  [D1] Skipping D1 overrides (${err.message.split("\n")[0]})`);
    return events;
  }

  if (!rows || rows.length === 0) {
    return events;
  }

  const isSameDate = (d1Str, d2Str) => {
    if (!d1Str || !d2Str) return false;
    const t1 = new Date(d1Str).getTime();
    const t2 = new Date(d2Str).getTime();
    if (Number.isNaN(t1) || Number.isNaN(t2)) return false;
    return Math.abs(t1 - t2) < 24 * 60 * 60 * 1000;
  };

  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const byTitle = new Map();
  for (const r of rows) {
    if (!byTitle.has(r.normalized_title)) byTitle.set(r.normalized_title, []);
    byTitle.get(r.normalized_title).push(r);
  }

  const existingSlugsInD1 = new Set(rows.map((r) => r.slug));

  const filtered = [];
  for (const ev of events) {
    // Look for matching D1 row for THIS specific occurrence (must match date)
    let d1Row = bySlug.get(ev.slug);
    if (d1Row && !isSameDate(d1Row.display_event_starts_at, ev.event_starts_at)) {
      d1Row = null;
    }

    if (!d1Row) {
      const candidates = byTitle.get(normTitle(ev.title));
      if (candidates) {
        d1Row = candidates.find((c) =>
          isSameDate(c.display_event_starts_at, ev.event_starts_at)
        );
      }
    }

    if (d1Row) {
      // Check if admin disabled or cancelled this specific occurrence
      if (d1Row.display_enabled === 0 || d1Row.occurrence_status === "cancelled") {
        console.log(`  [D1] Suppressed admin-disabled event: "${ev.title}" (${d1Row.slug})`);
        continue;
      }

      // Apply admin display_* overrides if present
      const overridden = {
        ...ev,
        slug: d1Row.slug || ev.slug,
        title: d1Row.display_title || ev.title,
        author: d1Row.display_author !== undefined ? d1Row.display_author : ev.author,
        excerpt: d1Row.display_excerpt || ev.excerpt,
        full_content: d1Row.display_full_content || ev.full_content,
        image_url: d1Row.display_image_url || ev.image_url,
        event_starts_at: d1Row.display_event_starts_at || ev.event_starts_at,
        event_ends_at: d1Row.display_event_ends_at || ev.event_ends_at,
        venue: d1Row.display_venue || ev.venue,
        url: d1Row.display_url || ev.url,
        learn_more: d1Row.display_learn_more || ev.learn_more,
        tags: d1Row.display_tags ? JSON.parse(d1Row.display_tags) : ev.tags,
      };
      filtered.push(overridden);
    } else {
      let slug = ev.slug;
      if (existingSlugsInD1.has(slug)) {
        const dateStamp = ev.event_starts_at.slice(0, 10).replace(/-/g, "");
        if (!slug.endsWith(dateStamp)) {
          slug = `${slug}-${dateStamp}`;
        }
      }
      filtered.push({ ...ev, slug });
    }
  }

  return filtered;
}
