export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fetches JSON from Discourse, retrying on transient failures (429 / 5xx).
// Honours the Retry-After header on 429, falling back to exponential backoff.
export async function fetchJson(url, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res.json();

    const transient = res.status === 429 || res.status >= 500;
    if (!transient || attempt >= retries) {
      throw new Error(`Fetch failed for ${url}: ${res.status}`);
    }

    const retryAfter = Number(res.headers.get("retry-after"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1000 * 2 ** attempt;
    console.warn(`  ${res.status} from ${url}; retrying in ${delay}ms`);
    await sleep(delay);
  }
}

// Like fetchJson but returns text, for the sitemap (which is XML). Reuses the
// same retry/backoff policy as fetchJson via a shared core would be nicer, but
// the sitemap is a single non-critical call, so a plain fetch is enough.
export async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed for ${url}: ${res.status}`);
  return res.text();
}
