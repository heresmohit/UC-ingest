// Fires the same Cloudflare Pages deploy hook ingest.yml already uses after
// a nightly build, so an admin edit shows up on improvlore.com/events within
// the time it takes Pages to rebuild (~1-2 min) instead of waiting for the
// next nightly ingest. Best-effort: a failed trigger shouldn't fail the
// admin's save, since the edit already landed in D1 regardless.
export async function triggerRebuild(env) {
  if (!env.CF_DEPLOY_HOOK) return;
  try {
    await fetch(env.CF_DEPLOY_HOOK, { method: "POST" });
  } catch (err) {
    console.error("Pages rebuild trigger failed:", err.message);
  }
}
