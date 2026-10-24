import { writeFile, readFile } from "fs/promises";
import { COMMUNITIES_CONFIG } from "./lib/config.js";
import {
  fetchCalendar,
  fetchTopicDetail,
  getTopicAuthor,
  buildEvent,
} from "./lib/discourse.js";
import { mergeCustomEvents } from "./lib/merge.js";
import {
  downloadEventsDb,
  extractBlrTodayEvents,
  DEFAULT_DB_PATH,
} from "./lib/blr-today.js";
import { applyD1Overrides } from "./lib/d1-overrides.js";

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

  if (community.source === "blr-today" || community.name === "improvlore") {
    try {
      console.log(`  Source: blr.today automated dataset (${DEFAULT_DB_PATH})`);
      await downloadEventsDb(DEFAULT_DB_PATH);
      const blrEvents = extractBlrTodayEvents(DEFAULT_DB_PATH, { filterFuture: true });
      console.log(`  Extracted ${blrEvents.length} events from blr.today`);

      const customEvents = await loadCustomEvents(community);
      console.log(`  Loaded ${customEvents.length} custom events`);
      const mergedWithCustom = mergeCustomEvents(blrEvents, customEvents);

      const all = await applyD1Overrides(mergedWithCustom, community.name);
      all.sort(
        (a, b) => new Date(normalizeDate(a.event_starts_at)) - new Date(normalizeDate(b.event_starts_at))
      );

      await writeFile(community.output, JSON.stringify(all, null, 2));
      console.log(`  Written ${all.length} events to ${community.output}`);
      return;
    } catch (err) {
      console.warn(`  blr.today extraction failed: ${err.message}. Falling back to Discourse...`);
    }
  }

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

  const details = await Promise.allSettled(
    matched.map(({ topic }) => fetchTopicDetail(topic.slug, topic.id))
  );

  // Skip any topic whose detail fetch ultimately failed (e.g. deleted topic or
  // persistent rate-limiting) rather than failing the whole community build.
  const discourseEvents = matched.flatMap(({ topic, author }, i) => {
    const result = details[i];
    if (result.status !== "fulfilled") {
      console.warn(`  Skipping "${topic.title}": ${result.reason.message}`);
      return [];
    }
    return [
      buildEvent(topic, result.value, author, {
        includeThumbnails: community.includeThumbnails ?? false,
      }),
    ];
  });

  const customEvents = await loadCustomEvents(community);
  console.log(`  Loaded ${customEvents.length} custom events`);

  const all = mergeCustomEvents(discourseEvents, customEvents).sort(
    (a, b) => new Date(normalizeDate(a.event_starts_at)) - new Date(normalizeDate(b.event_starts_at))
  );

  await writeFile(community.output, JSON.stringify(all, null, 2));
  console.log(`  Written ${all.length} events to ${community.output}`);
}

async function main() {
  const all = await loadCommunities();
  // Communities default to enabled; set "enabled": false to skip one without
  // removing its config (JSON has no comments).
  const communities = all.filter((c) => c.enabled !== false);
  const skipped = all.length - communities.length;
  console.log(
    `Building ${communities.length} communities from ${COMMUNITIES_CONFIG}` +
      (skipped ? ` (${skipped} disabled)` : "")
  );

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
