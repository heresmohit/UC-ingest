import { normTitle } from "../../../src/lib/merge.js";

const COMMUNITY = "improvlore";

// Every editable field, as (jsonKey, columnSuffix) pairs — mirrors
// src/sync-d1.js's FIELDS list exactly, since both sides read/write the same
// display_*/ingested_* column pairs.
export const FIELDS = [
  ["title", "title"],
  ["author", "author"],
  ["excerpt", "excerpt"],
  ["full_content", "full_content"],
  ["image_url", "image_url"],
  ["event_starts_at", "event_starts_at"],
  ["event_ends_at", "event_ends_at"],
  ["venue", "venue"],
  ["url", "url"],
  ["learn_more", "learn_more"],
];

const EDITABLE_COLUMNS = new Set([...FIELDS.map(([, col]) => col), "tags"]);

function rowToEvent(row) {
  const event = { id: row.id, slug: row.slug, normalized_title: row.normalized_title };
  const diff = {};
  for (const [jsonKey, col] of FIELDS) {
    event[jsonKey] = row[`display_${col}`];
    if ((row[`ingested_${col}`] ?? null) !== (row[`display_${col}`] ?? null)) {
      diff[jsonKey] = row[`ingested_${col}`];
    }
  }
  event.tags = JSON.parse(row.display_tags ?? "[]");
  const ingestedTags = row.ingested_tags ?? "[]";
  if (ingestedTags !== (row.display_tags ?? "[]")) {
    diff.tags = JSON.parse(ingestedTags);
  }
  event.enabled = !!row.display_enabled;
  event.occurrence_status = row.occurrence_status; // null | 'occurred' | 'cancelled'
  event.is_past = new Date(row.display_event_starts_at) < new Date();
  event.last_edited_at = row.last_edited_at;
  if (Object.keys(diff).length > 0) event.pending_source_update = diff;
  return event;
}

// All events for the (single, hardcoded) community, grouped by normalized
// title — a recurring show's past and future dates all land in one group.
export async function getGroupedEvents(db) {
  const { results } = await db
    .prepare(
      `SELECT * FROM events WHERE community = ? ORDER BY normalized_title, display_event_starts_at`
    )
    .bind(COMMUNITY)
    .all();

  const groups = new Map();
  for (const row of results) {
    const event = rowToEvent(row);
    if (!groups.has(row.normalized_title)) {
      groups.set(row.normalized_title, { title: event.title, events: [] });
    }
    groups.get(row.normalized_title).events.push(event);
  }
  return [...groups.values()];
}

// Patches exactly one event row. `patch` may include any editable field
// (writes to display_<col>), `enabled` (display_enabled), or
// occurrence_status. Never touches ingested_* — that's sync-d1.js's lane only.
export async function patchEvent(db, id, patch) {
  const sets = [];
  const values = [];

  for (const [jsonKey, col] of Object.entries(patch)) {
    if (jsonKey === "enabled") {
      sets.push("display_enabled = ?");
      values.push(patch.enabled ? 1 : 0);
    } else if (jsonKey === "occurrence_status") {
      if (patch.occurrence_status !== "occurred" && patch.occurrence_status !== "cancelled") {
        throw new Error(`Invalid occurrence_status: ${patch.occurrence_status}`);
      }
      sets.push("occurrence_status = ?");
      values.push(patch.occurrence_status);
    } else if (jsonKey === "tags") {
      sets.push("display_tags = ?");
      values.push(JSON.stringify(patch.tags ?? []));
    } else if (EDITABLE_COLUMNS.has(jsonKey)) {
      sets.push(`display_${jsonKey} = ?`);
      values.push(patch[jsonKey]);
    }
    // unknown keys are silently ignored rather than erroring, so a client
    // sending an extra field (e.g. `id`) doesn't break the request
  }

  if (patch.title !== undefined) {
    sets.push("normalized_title = ?");
    values.push(normTitle(patch.title));
  }

  if (sets.length === 0) return;

  sets.push("last_edited_at = datetime('now')");
  values.push(id, COMMUNITY);

  await db
    .prepare(`UPDATE events SET ${sets.join(", ")} WHERE id = ? AND community = ?`)
    .bind(...values)
    .run();
}

export async function setCommunityEnabled(db, enabled) {
  await db
    .prepare("UPDATE communities SET display_enabled = ?, updated_at = datetime('now') WHERE name = ?")
    .bind(enabled ? 1 : 0, COMMUNITY)
    .run();
}

export async function getCommunityState(db) {
  const row = await db
    .prepare("SELECT display_enabled FROM communities WHERE name = ?")
    .bind(COMMUNITY)
    .first();
  return { enabled: !!row?.display_enabled };
}

// Public feed: same shape as today's release JSON, future-only, mirroring
// build.js's own filter exactly. occurrence_status never factors in here —
// it's an admin/history-only concept, and a past event is already excluded
// by the date filter regardless of whether it occurred or was cancelled.
// Returns { events, lastSyncedAt } — lastSyncedAt is communities.updated_at,
// bumped by sync-d1.js on every run (whether or not any event data actually
// changed), so it answers "did the nightly sync last actually run" rather
// than "is the Worker alive right now". Kept out of the JSON body (which
// stays a bare array — improvlore.com's events.js iterates it directly) and
// surfaced as a response header instead; see public-feed.js.
export async function getPublicFeed(db) {
  const community = await db
    .prepare("SELECT display_enabled, updated_at FROM communities WHERE name = ?")
    .bind(COMMUNITY)
    .first();
  if (!community?.display_enabled) return { events: [], lastSyncedAt: community?.updated_at ?? null };

  const { results } = await db
    .prepare(
      `SELECT * FROM events
       WHERE community = ? AND display_enabled = 1 AND display_event_starts_at >= datetime('now')
       ORDER BY display_event_starts_at`
    )
    .bind(COMMUNITY)
    .all();

  const events = results.map((row) => {
    const event = {};
    for (const [jsonKey, col] of FIELDS) event[jsonKey] = row[`display_${col}`];
    event.slug = row.slug;
    event.tags = JSON.parse(row.display_tags ?? "[]");
    return event;
  });

  return { events, lastSyncedAt: community.updated_at };
}
