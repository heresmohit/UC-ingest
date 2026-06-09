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
