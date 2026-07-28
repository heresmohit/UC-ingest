import { setCommunityEnabled } from "../lib/queries.js";
import { triggerRebuild } from "../lib/rebuild.js";

export async function handlePatchCommunity(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (typeof body.enabled !== "boolean") {
    return new Response('Body must include a boolean "enabled"', { status: 400 });
  }

  await setCommunityEnabled(env.DB, body.enabled);
  await triggerRebuild(env);
  return new Response(null, { status: 204 });
}
