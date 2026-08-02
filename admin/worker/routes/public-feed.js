import { getPublicFeed } from "../lib/queries.js";

export async function handlePublicFeed(request, env) {
  const { events, lastSyncedAt } = await getPublicFeed(env.DB);
  return new Response(JSON.stringify(events, null, 2), {
    headers: {
      "content-type": "application/json",
      // Request-time timestamp — confirms the Worker/D1 are alive and
      // responding right now. Body stays a bare array so improvlore.com's
      // events.js (which iterates it directly) is untouched.
      "x-generated-at": new Date().toISOString(),
      // communities.updated_at, bumped only when sync-d1.js runs — answers
      // "did the nightly sync last actually run", not just "is this request
      // succeeding". SQLite datetime('now') has no timezone suffix; treat as
      // UTC when parsing on the client side.
      "x-last-synced-at": lastSyncedAt ? `${lastSyncedAt.replace(" ", "T")}Z` : "",
    },
  });
}
