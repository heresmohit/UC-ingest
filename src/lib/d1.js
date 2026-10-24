import { execFileSync } from "child_process";

// Thin client over Cloudflare's D1 HTTP query API — matches this repo's
// zero-dependency, native-fetch style (see http.js). Used only by
// sync-d1.js, which runs as a plain Node process in CI and therefore has no
// `env.DB` Worker binding to call into.
//
// Local development: set D1_LOCAL=1 to shell out to `wrangler d1 execute
// --local` instead (run from admin/, where the local D1 sqlite file lives).
// This avoids burning real API calls while iterating on sync-d1.js, and lets
// it run without Cloudflare credentials at all. CI always uses the real HTTP
// API path below.
const D1_LOCAL = process.env.D1_LOCAL === "1";
const ADMIN_DIR = new URL("../../admin", import.meta.url).pathname;

function inlineSql(sql, params) {
  const p = [...params];
  return sql.replace(/\?/g, () => literal(p.shift()));
}

function runWrangler(command, { remote = false } = {}) {
  const args = ["d1", "execute", "uc-ingest", "--json", "--command", command];
  if (remote) {
    args.push("--remote");
  } else {
    args.push("--local");
  }
  const out = execFileSync("wrangler", args, {
    cwd: ADMIN_DIR,
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 32,
  });
  return JSON.parse(out);
}

function literal(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Runs a single statement against D1 and returns its result rows (empty
// array for statements with no rows, e.g. INSERT/UPDATE).
export async function d1Query(sql, params = []) {
  if (D1_LOCAL) {
    const results = runWrangler(inlineSql(sql, params), { remote: false });
    return results[0]?.results ?? [];
  }

  const { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } = process.env;
  if (CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN) {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sql, params }),
      }
    );

    const body = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(`D1 query failed: ${JSON.stringify(body.errors ?? body)}`);
    }
    return body.result?.[0]?.results ?? [];
  }

  // Fallback to wrangler with --remote (e.g. running locally without API token)
  const results = runWrangler(inlineSql(sql, params), { remote: true });
  return results[0]?.results ?? [];
}

// Runs several statements as one batch. CI uses the sequential HTTP query API;
// local wrangler runs execute all statements as a single multi-statement batch.
export async function d1Batch(statements) {
  if (!statements.length) return [];

  const { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } = process.env;
  if (!D1_LOCAL && CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN) {
    const results = [];
    for (const { sql, params } of statements) {
      results.push(await d1Query(sql, params));
    }
    return results;
  }

  const command =
    statements
      .map(({ sql, params }) => inlineSql(sql, params).trim().replace(/;$/, ""))
      .join(";\n") + ";";
  const results = runWrangler(command, { remote: !D1_LOCAL });
  return results.map((r) => r?.results ?? []);
}
