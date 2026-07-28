# UC-ingest

Fetches upcoming community events from the [Underline Center Discourse calendar](https://underline.center/c/calendar/5), merges them with manually curated events, and publishes one JSON file per community as a GitHub Release — all from a **single branch**. Each community is just a different filtered slice (by keyword and/or author) of the same forum.

## How it works

1. Reads [`communities.json`](communities.json), which defines each community to build.
2. Fetches the Underline Center calendar listing once (shared across all communities).
3. For each community:
   - Selects topics whose title contains the community's `filterKeyword` **or** whose original poster is in the community's `authors` list, and whose event is in the future.
   - Fetches full topic detail for each match (in parallel).
   - Merges with manually curated events (see below), filters out past ones.
   - Sorts by `event_starts_at` ascending and writes the community's `output` file.
4. The GitHub Actions workflow publishes all output files to a single release tag (`events-latest`).

## Run locally

```bash
node src/build.js   # or: npm run build
```

Requires Node 18+ (uses native `fetch`). No dependencies to install.

## Adding / changing communities

Edit [`communities.json`](communities.json). Each entry:

```json
{
  "name": "improvlore",
  "output": "improvlore.json",
  "filterKeyword": "improv",
  "authors": ["amehra4u"],
  "includeThumbnails": false
}
```

- `name` — identifier for the community (also used to find its custom-events file).
- `output` — filename written to the repo root and published to the release.
- `filterKeyword` — lowercase substring matched against each topic title.
- `authors` — optional Discourse usernames. A topic matches if it was posted by one of them, even when the title doesn't contain the keyword (e.g. `amehra4u` almost always posts improv events).
- `includeThumbnails` — optional, defaults to `false`. When `false`, only `image_url` is emitted; set `true` to also include Discourse's full `thumbnails` array (the same image at ~7 sizes), e.g. for responsive `srcset`.

When you add a new `output` filename, also list it under `files:` in [`.github/workflows/ingest.yml`](.github/workflows/ingest.yml) so it gets published.

## Fixed release URLs

```
https://github.com/heresmohit/UC-ingest/releases/download/events-latest/improvlore.json
https://github.com/heresmohit/UC-ingest/releases/download/events-latest/mtg.json
```

These URLs always point to the most recently generated files.

## Custom events

Add manually curated events in either:

- `custom.<community-name>.json` (e.g. `custom.improvlore.json`) — scoped to one community, or
- `custom.json` — shared fallback used when no per-community file exists.

Only `title` and `event_starts_at` are required.

```json
[
  {
    "title": "Show Name",
    "event_starts_at": "2026-06-15 19:30:00",
    "venue": "Venue Name",
    "url": "https://tickets.link",
    "learn_more": "https://more.info",
    "excerpt": "optional short description",
    "image_url": "https://optional-poster.jpg"
  }
]
```

Both `"2026-06-15 19:30:00"` and `"2026-06-15T19:30:00Z"` date formats are accepted. Past events are automatically filtered out.

Custom events have no `tags` field — this is how the front-end distinguishes them from Discourse events (which carry `["UC"]`).

## District recurring dates

A District event page can list several upcoming dates for the same show (one full `Event` JSON-LD block per date). [`district.js`](src/lib/district.js) extracts all of them, not just the first, keying each date as its own entry (`<sitemap-slug>-<YYYYMMDD>`) while `url`/`learn_more` still point at the one real District page. [`merge.js`](src/lib/merge.js) matches a Discourse post to whichever District date starts soonest when several share a title.

## Improv Lore admin (D1)

`improvlore` is the only community backed by a live, editable database — every other community stays pure JSON/Release as described above.

- After `node src/build.js` runs, `node src/sync-d1.js` upserts `improvlore.json` into a Cloudflare D1 database. It hashes the file first and skips straight to occurrence-rollover stamping (below) when nothing changed since the last run — no per-row writes on a quiet night.
- Each event row keeps a `display_*` value (what's actually shown / admin-editable) alongside an `ingested_*` value (the untouched last-synced value, kept only so the admin can see a source update and accept or ignore it). Sync only ever writes `ingested_*`; admin edits only ever write `display_*` — neither can clobber the other.
- Rows are never deleted. A past date is just a row whose `display_event_starts_at` has passed — grouping by show title (`normalized_title`) surfaces a show's full history, past and future, in one place. Sync stamps `occurrence_status = 'occurred'` the moment a date first crosses into the past; flip it to `'cancelled'` from the admin page if a show didn't actually happen.
- The admin page lives at **improvlore.com/admin** (a Cloudflare Worker route on the same zone as the improvlore.com Pages site — see [`admin/wrangler.jsonc`](admin/wrangler.jsonc)), protected by Cloudflare Access. It shows every event grouped by show, with every field editable, a per-event disable toggle, and a community-wide enable/disable toggle.
- The same Worker serves `improvlore.com/api/improvlore.json` — same shape as the release JSON, but sourced from D1 and reflecting admin edits/disables. [improvlore.com's `src/_data/events.js`](../improvlore.com/src/_data/events.js) fetches from here (falling back to the GitHub Release if the Worker is unreachable), so an admin save triggers a Cloudflare Pages rebuild (via the same `CF_DEPLOY_HOOK` used nightly) and shows up on improvlore.com/events within a minute or two.

### Setup (one-time)

```bash
cd admin
npm install
wrangler d1 create uc-ingest        # copy the printed database_id into wrangler.jsonc
npm run migrate:remote              # applies migrations/0001_init.sql
wrangler secret put CF_DEPLOY_HOOK  # same Pages deploy hook improvlore.com/.env already has
npm run deploy
```

GitHub Actions needs three repo secrets for the `Sync improvlore to D1` step in [`ingest.yml`](.github/workflows/ingest.yml): `CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID` (from the `d1 create` output above), and `CF_API_TOKEN` (a token scoped to D1:Edit only).

### Local development

```bash
cd admin
npm run migrate:local               # schema only, no Cloudflare account needed
wrangler dev --var ENVIRONMENT:development   # skips the Access check locally
```

```bash
D1_LOCAL=1 node src/sync-d1.js      # syncs into the local D1 instance above instead of the real HTTP API
```
