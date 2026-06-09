// "https://district.in/some-slug-jun13-2026/event" -> "some-slug-jun13-2026".
// District keeps the date suffix that Discourse drops, so dedup must use the
// slug District serves (derived from the event's url), never event.slug.
function districtSlugFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const i = parts.lastIndexOf("event");
    return i > 0 ? parts[i - 1] : parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

const normTitle = (t) => (t ?? "").replace(/\s+/g, " ").trim().toLowerCase();

// Merge District events into the Discourse/custom list with District winning on
// conflict. A base event matches a District event by District slug (derived
// from its url) or, as a fallback, by normalised title — because a Discourse
// event posted without its District ticket link has no slug to match on, and
// we must not emit it twice (once from Discourse, once from District). On a
// match we keep the base event but overwrite the fields District owns
// (date/time, ticket url/image). District-only events are appended.
export function mergeDistrict(baseEvents, districtBySlug) {
  if (districtBySlug.size === 0) return baseEvents;

  // Secondary index so a slug-less base event can still find its District twin.
  const byTitle = new Map();
  for (const d of districtBySlug.values()) {
    const key = normTitle(d.title);
    if (key) byTitle.set(key, d);
  }

  const matched = new Set();
  const merged = baseEvents.map((ev) => {
    const slug = districtSlugFromUrl(ev.url);
    const d = (slug && districtBySlug.get(slug)) || byTitle.get(normTitle(ev.title));
    if (!d) return ev;
    matched.add(d.slug);
    // District owns the schedule and the live ticket link; keep the richer
    // Discourse copy (excerpt/full_content/learn_more) where we have it.
    return {
      ...ev,
      event_starts_at: d.event_starts_at,
      event_ends_at: d.event_ends_at,
      image_url: ev.image_url ?? d.image_url,
      url: d.url,
    };
  });

  // District-only events (no Discourse/custom counterpart).
  for (const [slug, d] of districtBySlug) {
    if (!matched.has(slug)) merged.push(d);
  }
  return merged;
}
