import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { COMMUNITIES_CONFIG } from "./lib/config.js";
import { normTitle } from "./lib/merge.js";
import { d1Query, d1Batch } from "./lib/d1.js";

// Scope is deliberately a single hardcoded community for now — see the admin
// plan. Not a loop over communities.json, since every other community stays
// pure JSON/Release with no D1 involvement at all.
const COMMUNITY_NAME = "improvlore";

// Every editable event field, as (jsonKey, columnSuffix) pairs. Drives both
// the ingested_* column list and the display_* seeding on insert.
const FIELDS = [
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

function hash(text) {
  return createHash("sha256").update(text).digest("hex");
}

function tagsJson(tags) {
  return JSON.stringify(tags ?? []);
}

async function loadCommunityConfig() {
  const raw = await readFile(COMMUNITIES_CONFIG, "utf8");
  const all = JSON.parse(raw);
  const cfg = all.find((c) => c.name === COMMUNITY_NAME);
  if (!cfg) throw new Error(`"${COMMUNITY_NAME}" not found in ${COMMUNITIES_CONFIG}`);
  return cfg;
}

async function upsertCommunityRow(cfg) {
  const ingestedEnabled = cfg.enabled !== false ? 1 : 0;
  await d1Query(
    `INSERT INTO communities (name, output, ingested_enabled, display_enabled)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (name) DO UPDATE SET
       output = excluded.output,
       ingested_enabled = excluded.ingested_enabled,
       updated_at = datetime('now')`,
    [cfg.name, cfg.output, ingestedEnabled, ingestedEnabled]
  );
}

async function getStoredHash() {
  const rows = await d1Query("SELECT last_source_hash FROM communities WHERE name = ?", [
    COMMUNITY_NAME,
  ]);
  return rows[0]?.last_source_hash ?? null;
}

async function setStoredHash(newHash) {
  await d1Query("UPDATE communities SET last_source_hash = ? WHERE name = ?", [
    newHash,
    COMMUNITY_NAME,
  ]);
}

// Existing ingested_* values for every row of this community, keyed by slug,
// so incoming events can be diffed against what's already stored without a
// per-row round trip.
async function loadExistingRows() {
  const rows = await d1Query(
    `SELECT slug, ${FIELDS.map(([, col]) => `ingested_${col}`).join(", ")}, ingested_tags
     FROM events WHERE community = ?`,
    [COMMUNITY_NAME]
  );
  return new Map(rows.map((r) => [r.slug, r]));
}

function hasChanged(event, existing) {
  if (!existing) return true;
  for (const [jsonKey, col] of FIELDS) {
    if ((event[jsonKey] ?? null) !== (existing[`ingested_${col}`] ?? null)) return true;
  }
  if (tagsJson(event.tags) !== (existing.ingested_tags ?? "[]")) return true;
  return false;
}

function buildUpsert(event) {
  const title = normTitle(event.title);
  const insertCols = ["community", "slug", "normalized_title"];
  const insertVals = [COMMUNITY_NAME, event.slug, title];
  const updateSets = ["last_synced_at = datetime('now')", "normalized_title = excluded.normalized_title"];

  for (const [jsonKey, col] of FIELDS) {
    insertCols.push(`display_${col}`, `ingested_${col}`);
    insertVals.push(event[jsonKey] ?? null, event[jsonKey] ?? null);
    updateSets.push(`ingested_${col} = excluded.ingested_${col}`);
  }
  insertCols.push("display_tags", "ingested_tags", "ingested_thumbnails");
  insertVals.push(tagsJson(event.tags), tagsJson(event.tags), JSON.stringify(event.thumbnails ?? null));
  updateSets.push("ingested_tags = excluded.ingested_tags", "ingested_thumbnails = excluded.ingested_thumbnails");

  const placeholders = insertVals.map(() => "?").join(", ");
  return {
    sql: `INSERT INTO events (${insertCols.join(", ")})
          VALUES (${placeholders})
          ON CONFLICT (community, slug) DO UPDATE SET
            ${updateSets.join(",\n            ")}`,
    params: insertVals,
  };
}

async function stampOccurrenceRollover() {
  const result = await d1Query(
    `UPDATE events
     SET occurrence_status = 'occurred'
     WHERE community = ?
       AND occurrence_status IS NULL
       AND display_event_starts_at < datetime('now')`,
    [COMMUNITY_NAME]
  );
  return result;
}

async function main() {
  const cfg = await loadCommunityConfig();
  await upsertCommunityRow(cfg);

  const raw = await readFile(cfg.output, "utf8");
  const newHash = hash(raw);
  const storedHash = await getStoredHash();

  if (newHash === storedHash) {
    console.log(`No source change for ${COMMUNITY_NAME} since last sync — skipping row sync.`);
    await stampOccurrenceRollover();
    console.log("Occurrence rollover stamped (if any rows crossed into the past).");
    return;
  }

  const events = JSON.parse(raw);
  const existingBySlug = await loadExistingRows();

  const toUpsert = events.filter((e) => hasChanged(e, existingBySlug.get(e.slug)));
  console.log(
    `${COMMUNITY_NAME}: ${events.length} event(s) in source, ${toUpsert.length} changed-or-new`
  );

  if (toUpsert.length > 0) {
    await d1Batch(toUpsert.map(buildUpsert));
  }

  await stampOccurrenceRollover();
  await setStoredHash(newHash);
  console.log(`Synced ${toUpsert.length} row(s), rollover stamped, hash updated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
