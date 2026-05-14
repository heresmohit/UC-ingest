import { writeFile, readFile } from "fs/promises";

const CALENDAR_URL = "https://underline.center/c/calendar/5.json";
const BASE_URL = "https://underline.center";
const VENUE = "Underline Center, Indiranagar";
const TAGS = ["UC"];
const FILTER_KEYWORD = "improv"; // change this to filter for a different event type

function normalizeDate(str) {
  return str.replace(" ", "T");
}

function isFuture(dateStr) {
  return new Date(normalizeDate(dateStr)) > new Date();
}

async function fetchCalendar() {
  const res = await fetch(CALENDAR_URL);
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
  const data = await res.json();
  return data.topic_list?.topics ?? [];
}

async function fetchTopicDetail(slug, id) {
  const url = `${BASE_URL}/t/${slug}/${id}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Topic fetch failed for ${slug}/${id}: ${res.status}`);
  return res.json();
}

function getEventTags(title, description) {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const tags = [...TAGS];
  if (text.includes("show")) tags.push("show");
  if (text.includes("jam")) tags.push("jam");
  return tags;
}

function buildEvent(topic, detail) {
  const post = detail.post_stream?.posts?.[0];
  const description = post?.raw ?? topic.excerpt ?? null;
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
    learn_more: `${BASE_URL}/t/${topic.slug}/${topic.id}`,
    venue: VENUE,
    tags: getEventTags(topic.title, description),
  };
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
  const topics = await fetchCalendar();

  const improv = topics.filter(
    (t) =>
      t.title?.toLowerCase().includes(FILTER_KEYWORD) &&
      t.event_starts_at &&
      isFuture(t.event_starts_at)
  );

  console.log(`Found ${improv.length} upcoming "${FILTER_KEYWORD}" topics`);

  const details = await Promise.all(
    improv.map((t) => fetchTopicDetail(t.slug, t.id))
  );

  const discourseEvents = improv.map((topic, i) => buildEvent(topic, details[i]));

  const customEvents = await loadCustomEvents();
  console.log(`Loaded ${customEvents.length} custom events`);

  const all = [...discourseEvents, ...customEvents].sort(
    (a, b) => new Date(normalizeDate(a.event_starts_at)) - new Date(normalizeDate(b.event_starts_at))
  );

  await writeFile("events.json", JSON.stringify(all, null, 2));
  console.log(`Written ${all.length} events to events.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
