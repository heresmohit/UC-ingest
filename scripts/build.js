import { writeFile, readFile } from "fs/promises";

const VENUE = "Underline Center, Indiranagar";
const TAGS = ["UC"];
const FILTER_KEYWORD = "magic: the gathering"; // change this to filter for a different event type

// Discourse sources to pull from. Both expose the same Discourse JSON API
// shape (category listing + per-topic detail), so one fetcher handles both.
const SOURCES = [
  {
    name: "underline",
    baseUrl: "https://underline.center",
    categoryUrl: "https://underline.center/c/calendar/5.json",
  },
  {
    name: "reroll",
    baseUrl: "https://forum.reroll.in",
    categoryUrl: "https://forum.reroll.in/c/events/10.json",
  },
];

function normalizeDate(str) {
  return str.replace(" ", "T");
}

function isFuture(dateStr) {
  return new Date(normalizeDate(dateStr)) > new Date();
}

async function fetchCalendar(categoryUrl) {
  const res = await fetch(categoryUrl);
  if (!res.ok) throw new Error(`Calendar fetch failed (${categoryUrl}): ${res.status}`);
  const data = await res.json();
  return data.topic_list?.topics ?? [];
}

async function fetchTopicDetail(baseUrl, slug, id) {
  const url = `${baseUrl}/t/${slug}/${id}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Topic fetch failed for ${slug}/${id}: ${res.status}`);
  return res.json();
}

function buildEvent(source, topic, detail) {
  const post = detail.post_stream?.posts?.[0];
  return {
    title: topic.title,
    excerpt: topic.excerpt ?? null,
    full_content: post?.raw ?? null,
    image_url: topic.image_url ?? null,
    thumbnails: topic.thumbnails ?? [],
    event_starts_at: topic.event_starts_at,
    event_ends_at: topic.event_ends_at ?? null,
    slug: topic.slug,
    url: post?.event?.url ?? null,
    learn_more: `${source.baseUrl}/t/${topic.slug}/${topic.id}`,
    venue: VENUE,
    tags: TAGS,
    source: source.name,
  };
}

async function fetchSourceEvents(source) {
  const topics = await fetchCalendar(source.categoryUrl);

  const matched = topics.filter(
    (t) =>
      t.title?.toLowerCase().includes(FILTER_KEYWORD) &&
      t.event_starts_at &&
      isFuture(t.event_starts_at)
  );

  console.log(`[${source.name}] Found ${matched.length} upcoming "${FILTER_KEYWORD}" topics`);

  const details = await Promise.all(
    matched.map((t) => fetchTopicDetail(source.baseUrl, t.slug, t.id))
  );

  return matched.map((topic, i) => buildEvent(source, topic, details[i]));
}

// Two events are considered the same real-world event when they start at the
// same instant at the same venue. Titles vary between sources (e.g. underline's
// "Magic: The Gathering with ReRoll Board Games" vs reroll's
// "Magic: The Gathering | Every Saturday | ..."), so start-time + venue is a
// more reliable comparator than the title.
function eventKey(event) {
  const startsAt = new Date(normalizeDate(event.event_starts_at)).getTime();
  return `${event.venue}__${startsAt}`;
}

function dedupeEvents(events) {
  const byKey = new Map();
  for (const event of events) {
    const key = eventKey(event);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, event);
      continue;
    }
    // Same event from a second source: merge sources, keep the richer record.
    console.log(
      `Duplicate event matched across sources (${existing.source} + ${event.source}): "${existing.title}" @ ${existing.event_starts_at}`
    );
    existing.sources = [...new Set([...(existing.sources ?? [existing.source]), event.source])];
    if (!existing.full_content && event.full_content) existing.full_content = event.full_content;
    if (!existing.image_url && event.image_url) existing.image_url = event.image_url;
  }
  return [...byKey.values()];
}

async function loadCustomEvents() {
  try {
    const raw = await readFile("custom.json", "utf8");
    const events = JSON.parse(raw);
    return events.filter((e) => e.event_starts_at && isFuture(e.event_starts_at));
  } catch {
    return [];
  }
}

async function main() {
  const perSource = await Promise.all(SOURCES.map((s) => fetchSourceEvents(s)));
  const sourceEvents = dedupeEvents(perSource.flat());

  const customEvents = await loadCustomEvents();
  console.log(`Loaded ${customEvents.length} custom events`);

  const all = [...sourceEvents, ...customEvents].sort(
    (a, b) => new Date(normalizeDate(a.event_starts_at)) - new Date(normalizeDate(b.event_starts_at))
  );

  await writeFile("events.json", JSON.stringify(all, null, 2));
  console.log(`Written ${all.length} events to events.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
