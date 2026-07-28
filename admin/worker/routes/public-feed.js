import { getPublicFeed } from "../lib/queries.js";

export async function handlePublicFeed(request, env) {
  const events = await getPublicFeed(env.DB);
  return new Response(JSON.stringify(events, null, 2), {
    headers: { "content-type": "application/json" },
  });
}
