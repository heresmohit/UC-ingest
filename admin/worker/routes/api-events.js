import { getAllEvents, patchEvent, deleteEvent } from "../lib/queries.js";
import { triggerRebuild } from "../lib/rebuild.js";

export async function handleListEvents(request, env) {
  const events = await getAllEvents(env.DB);
  return new Response(JSON.stringify(events, null, 2), {
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

  const { rebuild, ...fields } = patch;

  try {
    await patchEvent(env.DB, id, fields);
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }

  if (rebuild) {
    await triggerRebuild(env);
  }

  return new Response(null, { status: 204 });
}

export async function handleDeleteEvent(request, env, id) {
  try {
    await deleteEvent(env.DB, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return new Response(err.message, { status: 400 });
  }
}
