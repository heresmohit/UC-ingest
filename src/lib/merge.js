// Strips punctuation as well as collapsing whitespace: handles minor title
// discrepancies across feeds and ensures consistent normalization for deduplication.
export const normTitle = (t) =>
  (t ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Merges custom events (e.g. from custom.json or custom.improvlore.json) onto
// raw ingest events. Custom events override raw events on match (by normalized
// title and date) and standalone custom events are appended.
export function mergeCustomEvents(rawEvents, customEvents) {
  if (!customEvents || customEvents.length === 0) return rawEvents;

  const customByTitle = new Map();
  for (const ce of customEvents) {
    const key = normTitle(ce.title);
    if (!customByTitle.has(key)) customByTitle.set(key, []);
    customByTitle.get(key).push(ce);
  }

  const usedCustom = new Set();
  const merged = rawEvents.map((raw) => {
    const key = normTitle(raw.title);
    const candidates = customByTitle.get(key);
    if (!candidates || candidates.length === 0) return raw;

    // Find custom candidate matching date or pick first
    const rawDate = (raw.event_starts_at || "").slice(0, 10);
    const matchIdx = candidates.findIndex((c) => {
      const cDate = (c.event_starts_at || "").slice(0, 10);
      return cDate === rawDate;
    });

    const custom = matchIdx >= 0 ? candidates.splice(matchIdx, 1)[0] : candidates.shift();
    if (!custom) return raw;

    usedCustom.add(custom);
    return {
      ...raw,
      ...custom,
      slug: custom.slug || raw.slug,
      tags: custom.tags !== undefined ? custom.tags : raw.tags,
    };
  });

  for (const ce of customEvents) {
    if (!usedCustom.has(ce)) {
      merged.push(ce);
    }
  }

  return merged.sort(
    (a, b) => new Date(a.event_starts_at) - new Date(b.event_starts_at)
  );
}
