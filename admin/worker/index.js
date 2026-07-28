import { handleAdminPage } from "./routes/admin-page.js";
import { handleListEvents, handlePatchEvent } from "./routes/api-events.js";
import { handlePatchCommunity } from "./routes/api-communities.js";
import { handlePublicFeed } from "./routes/public-feed.js";
import { getCommunityState } from "./lib/queries.js";

// Cloudflare Access sits in front of /admin and /api/admin/* in production
// (configured in the dashboard, scoped to the admin's email) — no
// application auth code needed there. Locally, wrangler dev has no Access
// session, so ENVIRONMENT=development (set via `wrangler dev --var
// ENVIRONMENT:development`, or the default vars in wrangler.jsonc for dev)
// skips the check. Never skip it when deployed.
function requireAdmin(request, env) {
  if (env.ENVIRONMENT === "development") return true;
  // Access injects a verified identity header once its policy passes; if a
  // request reaches the Worker without a policy in front of it, only the
  // deployed environment relies on Access actually being configured.
  return request.headers.has("Cf-Access-Jwt-Assertion");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname === "/admin") {
      if (!requireAdmin(request, env)) return new Response("Unauthorized", { status: 401 });
      return handleAdminPage();
    }

    if (pathname === "/api/admin/events") {
      if (!requireAdmin(request, env)) return new Response("Unauthorized", { status: 401 });
      if (request.method === "GET") return handleListEvents(request, env);
    }

    const eventMatch = pathname.match(/^\/api\/admin\/events\/(\d+)$/);
    if (eventMatch) {
      if (!requireAdmin(request, env)) return new Response("Unauthorized", { status: 401 });
      if (request.method === "PATCH") return handlePatchEvent(request, env, Number(eventMatch[1]));
    }

    if (pathname === "/api/admin/communities/improvlore") {
      if (!requireAdmin(request, env)) return new Response("Unauthorized", { status: 401 });
      if (request.method === "PATCH") return handlePatchCommunity(request, env);
      if (request.method === "GET") {
        return new Response(JSON.stringify(await getCommunityState(env.DB)), {
          headers: { "content-type": "application/json" },
        });
      }
    }

    if (pathname === "/api/improvlore.json") {
      return handlePublicFeed(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};
