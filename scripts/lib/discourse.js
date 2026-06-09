import { BASE_URL, CALENDAR_URL, VENUE, TAGS } from "./config.js";
import { fetchJson } from "./http.js";

export async function fetchCalendar() {
  const data = await fetchJson(CALENDAR_URL);
  return {
    topics: data.topic_list?.topics ?? [],
    users: data.users ?? [],
  };
}

export async function fetchTopicDetail(slug, id) {
  return fetchJson(`${BASE_URL}/t/${slug}/${id}.json`);
}

// The original poster's username, resolved from the listing's posters + users.
// Discourse marks the OP in poster.description (e.g. "Original Poster, ...").
export function getTopicAuthor(topic, usersById) {
  const op =
    topic.posters?.find((p) => /Original Poster/i.test(p.description ?? "")) ??
    topic.posters?.[0];
  return op ? usersById.get(op.user_id)?.username ?? null : null;
}

export function stripHtml(html) {
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

export function getEventTags(title, description) {
  const text = `${title} ${description ?? ""}`.toLowerCase();
  const tags = [...TAGS];
  if (text.includes("show")) tags.push("show");
  if (text.includes("jam")) tags.push("jam");
  return tags;
}

export function buildEvent(topic, detail, author, { includeThumbnails = false } = {}) {
  const post = detail.post_stream?.posts?.[0];
  const description = stripHtml(post?.cooked) ?? topic.excerpt ?? null;
  return {
    title: topic.title,
    author: author ?? post?.username ?? null,
    excerpt: topic.excerpt ?? null,
    full_content: description,
    image_url: topic.image_url ?? null,
    // Discourse returns the same image at ~7 sizes; most consumers only need
    // image_url, so the full array is opt-in per community (includeThumbnails).
    ...(includeThumbnails ? { thumbnails: topic.thumbnails ?? [] } : {}),
    event_starts_at: topic.event_starts_at,
    event_ends_at: topic.event_ends_at ?? null,
    slug: topic.slug,
    url: post?.event?.url ?? null,
    learn_more: `${BASE_URL}/t/${topic.slug}/${topic.id}`,
    venue: VENUE,
    tags: getEventTags(topic.title, description),
  };
}
