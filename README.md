# UC-ingest

Fetches upcoming improv events from the [Underline Center Discourse forum](https://underline.center/c/calendar/5), merges them with manually curated events, and publishes the result as `events.json` twice daily.

## How it works

1. Fetches `https://underline.center/c/calendar/5.json`
2. Filters topics where the title includes "improv" and the event is in the future
3. Fetches full topic detail for each match (in parallel)
4. Merges with events from `custom.json`, filters out past custom events
5. Sorts all events by `event_starts_at` ascending
6. Writes `events.json` and publishes it as a GitHub Release artifact

## Run locally

```bash
node scripts/build.js
```

Requires Node 18+ (uses native `fetch`). No dependencies to install.

## Fixed release URL

```
https://github.com/heresmohit/UC-ingest/releases/latest/download/events.json
```

This URL always points to the most recently generated file.

## custom.json format

Add manually curated events to `custom.json` at the repo root. Only `title` and `event_starts_at` are required.

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
