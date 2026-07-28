-- communities: one row per D1-backed community. Scope is improvlore only for
-- now, but the table isn't hardcoded to that name so a second community can
-- be added later without a schema change.
CREATE TABLE communities (
  name             TEXT PRIMARY KEY,
  output           TEXT NOT NULL,
  display_enabled  INTEGER NOT NULL DEFAULT 1,  -- admin-editable; drives the public feed
  ingested_enabled INTEGER NOT NULL DEFAULT 1,  -- last-synced communities.json "enabled", read-only reference
  last_source_hash TEXT,                        -- hash of the last-synced output JSON body; sync short-circuits when unchanged
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- events: one row per (community, slug). display_* is what the site/admin
-- shows and is admin-editable; ingested_* is the untouched last-synced value,
-- kept only so the admin can diff "what came from source" against "what's
-- live" and revert. Rows are never deleted — a past row is simply one whose
-- display_event_starts_at has passed; grouping by normalized_title over all
-- rows (past and future) is how a show's history is read.
CREATE TABLE events (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  community                 TEXT NOT NULL REFERENCES communities(name),
  slug                      TEXT NOT NULL,

  display_title             TEXT,
  ingested_title            TEXT,
  display_author            TEXT,
  ingested_author           TEXT,
  display_excerpt           TEXT,
  ingested_excerpt          TEXT,
  display_full_content      TEXT,
  ingested_full_content     TEXT,
  display_image_url         TEXT,
  ingested_image_url        TEXT,
  display_event_starts_at   TEXT,
  ingested_event_starts_at  TEXT,
  display_event_ends_at     TEXT,
  ingested_event_ends_at    TEXT,
  display_venue             TEXT,
  ingested_venue            TEXT,
  display_url               TEXT,
  ingested_url              TEXT,
  display_learn_more        TEXT,
  ingested_learn_more       TEXT,
  display_tags              TEXT,  -- JSON-encoded array
  ingested_tags             TEXT,  -- JSON-encoded array
  ingested_thumbnails       TEXT,  -- JSON-encoded array, reference-only

  display_enabled     INTEGER NOT NULL DEFAULT 1,  -- admin hard-disable toggle for this one instance
  occurrence_status    TEXT,                        -- NULL = unset (assume 'occurred' once past); 'occurred' | 'cancelled'
  normalized_title     TEXT NOT NULL,

  first_seen_at  TEXT NOT NULL DEFAULT (datetime('now')),
  last_synced_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_edited_at TEXT,

  UNIQUE (community, slug)
);

CREATE INDEX idx_events_community_starts ON events(community, display_event_starts_at);
CREATE INDEX idx_events_normalized_title ON events(community, normalized_title);
