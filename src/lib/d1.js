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

function runLocal(sql, params) {
  // wrangler d1 execute has no parameterized-query flag; inline params as
  // SQL literals. Safe here because sync-d1.js is the only caller and every
  // value it sends originates from our own ingest JSON, not user input.
  const inlined = sql.replace(/\?/g, () => literal(params.shift()));
  const out = execFileSync(
    "wrangler",
    ["d1", "execute", "uc-ingest", "--local", "--json", "--command", inlined],
    { cwd: ADMIN_DIR, encoding: "utf8", maxBuffer: 1024 * 1024 * 32 }
  );
  const [result] = JSON.parse(out);
  return result?.results ?? [];
}

function literal(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Runs a single statement against D1 and returns its result rows (empty
// array for statements with no rows, e.g. INSERT/UPDATE).
export async function d1Query(sql, params = []) {
  if (D1_LOCAL) return runLocal(sql, [...params]);

  const { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } = process.env;
  if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
    throw new Error(
      "Missing CF_ACCOUNT_ID / CF_D1_DATABASE_ID / CF_API_TOKEN (set D1_LOCAL=1 for local dev instead)"
    );
  }

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

// Runs several statements as one batch (D1's /query API accepts one
// statement per call, so this is a small sequential helper, not a true
// atomic batch — fine for sync-d1.js, which only ever writes rows derived
// from its own single-community JSON file and can safely re-run on failure).
export async function d1Batch(statements) {
  const results = [];
  for (const { sql, params } of statements) {
    results.push(await d1Query(sql, params));
  }
  return results;
}
