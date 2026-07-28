import { getGroupedEvents, patchEvent } from "../lib/queries.js";
import { triggerRebuild } from "../lib/rebuild.js";

export async function handleListEvents(request, env) {
  const groups = await getGroupedEvents(env.DB);
  return new Response(JSON.stringify(groups, null, 2), {
    headers: { "content-type": "application/json" },
  });
}

export async function handlePatchEvent(request, env, id) {
  let patch;
  try {
    patch = await request.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  try {
    await patchEvent(env.DB, id, patch);
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  await triggerRebuild(env);
  return new Response(null, { status: 204 });
}
