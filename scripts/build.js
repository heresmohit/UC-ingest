import { writeFile, readFile } from "fs/promises";

// UC-ingest pulls from the Underline Center Discourse calendar only — every
// community is a different slice (by keyword/author) of the same forum.
const BASE_URL = "https://underline.center";
const CALENDAR_URL = "https://underline.center/c/calendar/5.json";
const VENUE = "Underline Center, Indiranagar";
const TAGS = ["UC"];
const COMMUNITIES_CONFIG = "communities.json";

function normalizeDate(str) {
  return str.replace(" ", "T");
}

function isFuture(dateStr) {
  return new Date(normalizeDate(dateStr)) > new Date();
}

async function loadCommunities() {
  const raw = await readFile(COMMUNITIES_CONFIG, "utf8");
  return JSON.parse(raw);
}

async function fetchCalendar() {
  const res = await fetch(CALENDAR_URL);
  if (!res.ok) throw new Error(`Calendar fetch failed: ${res.status}`);
  const data = await res.json();
  return {
    topics: data.topic_list?.topics ?? [],
    users: data.users ?? [],
  };
}

async function fetchTopicDetail(slug, id) {
  const url = `${BASE_URL}/t/${slug}/${id}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Topic fetch failed for ${slug}/${id}: ${res.status}`);
  return res.json();
}

// The original poster's username, resolved from the listing's posters + users.
// Discourse marks the OP in poster.description (e.g. "Original Poster, ...").
function getTopicAuthor(topic, usersById) {
  const op =
    topic.posters?.find((p) => /Original Poster/i.test(p.description ?? "")) ??
    topic.posters?.[0];
  return op ? usersById.get(op.user_id)?.username ?? null : null;
}

function stripHtml(html) {
  if (!html) return null;
  const text = html
    .replace(/<div class="lightbox-wrapper">[\s\S]*?<\/div>/g, "")
    .replace(/<h[1-6][^>]*>[\s\S]*?Who are Improv Lore\?[\s\S]*$/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "’")
    .replace(/&quot;/g, '"')
    .replace(/\n{2,}/g, "\n")
    .trim();
  return text || null;
}

function getEventTags(title, description) {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const tags = [...TAGS];
  if (text.includes("show")) tags.push("show");
  if (text.includes("jam")) tags.push("jam");
  return tags;
}

function buildEvent(topic, detail, author) {
  const post = detail.post_stream?.posts?.[0];
  const description = stripHtml(post?.cooked) ?? topic.excerpt ?? null;
  return {
    title: topic.title,
    author: author ?? post?.username ?? null,
    excerpt: topic.excerpt ?? null,
    full_content: description,
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

async function loadCustomEvents(community) {
  // Per-community custom file (e.g. custom.improvlore.json) falls back to the
  // shared custom.json for backwards compatibility.
  for (const file of [`custom.${community.name}.json`, "custom.json"]) {
    try {
      const raw = await readFile(file, "utf8");
      const events = JSON.parse(raw);
      return events.filter((e) => e.event_starts_at && isFuture(e.event_starts_at));
    } catch {
      // try next candidate
    }
  }
  return [];
}

async function buildCommunity(community, calendar) {
  console.log(`\n=== Building "${community.name}" -> ${community.output} ===`);

  const { topics, users } = calendar;
  const usersById = new Map(users.map((u) => [u.id, u]));
  const keyword = community.filterKeyword.toLowerCase();
  const authorSet = new Set((community.authors ?? []).map((a) => a.toLowerCase()));

  // A topic matches if its title contains the keyword OR its original poster is
  // a known organiser (some events are titled loosely but always posted by them).
  const matched = topics
    .map((topic) => ({ topic, author: getTopicAuthor(topic, usersById) }))
    .filter(({ topic, author }) => {
      if (!topic.event_starts_at || !isFuture(topic.event_starts_at)) return false;
      const byKeyword = topic.title?.toLowerCase().includes(keyword);
      const byAuthor = author && authorSet.has(author.toLowerCase());
      return byKeyword || byAuthor;
    });

  console.log(
    `  Matched ${matched.length} upcoming topics (keyword "${keyword}"` +
      (authorSet.size ? ` or authors ${[...authorSet].join(", ")}` : "") +
      ")"
  );

  const details = await Promise.all(
    matched.map(({ topic }) => fetchTopicDetail(topic.slug, topic.id))
  );

  const discourseEvents = matched.map(({ topic, author }, i) =>
    buildEvent(topic, details[i], author)
  );

  const customEvents = await loadCustomEvents(community);
  console.log(`  Loaded ${customEvents.length} custom events`);

  const all = [...discourseEvents, ...customEvents].sort(
    (a, b) => new Date(normalizeDate(a.event_starts_at)) - new Date(normalizeDate(b.event_starts_at))
  );

  await writeFile(community.output, JSON.stringify(all, null, 2));
  console.log(`  Written ${all.length} events to ${community.output}`);
}

async function main() {
  const communities = await loadCommunities();
  console.log(`Building ${communities.length} communities from ${COMMUNITIES_CONFIG}`);

  // One calendar fetch shared across all communities; they're just different
  // filtered views of the same Underline Center listing.
  const calendar = await fetchCalendar();

  for (const community of communities) {
    await buildCommunity(community, calendar);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
