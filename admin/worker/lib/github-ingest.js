const REPO = "heresmohit/UC-ingest";
const WORKFLOW_ID = "ingest.yml";

export async function dispatchIngest(env, publishSite = false) {
  const token = env.GH_TOKEN || env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "GitHub token (GH_TOKEN) is not configured on the Worker. Run `wrangler secret put GH_TOKEN` with a GitHub Personal Access Token (repo scope)."
    );
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "uc-ingest-admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: { publish_site: !!publishSite },
      }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub dispatch failed (${res.status}): ${errorText}`);
  }

  return { ok: true, dispatchedAt: new Date().toISOString() };
}

export async function getIngestStatus(env) {
  const token = env.GH_TOKEN || env.GITHUB_TOKEN;
  if (!token) {
    return { ok: false, error: "GH_TOKEN not configured" };
  }

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW_ID}/runs?per_page=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "uc-ingest-admin",
      },
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub runs query failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const latestRun = data.workflow_runs?.[0];
  if (!latestRun) {
    return { ok: true, status: "idle", latestRun: null };
  }

  return {
    ok: true,
    runId: latestRun.id,
    status: latestRun.status, // "queued" | "in_progress" | "completed"
    conclusion: latestRun.conclusion, // "success" | "failure" | null
    createdAt: latestRun.created_at,
    updatedAt: latestRun.updated_at,
    htmlUrl: latestRun.html_url,
  };
}

