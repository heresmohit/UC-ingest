export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Shared fetch with retry on transient failures (429 / 5xx). Honours the
// Retry-After header on 429, falling back to exponential backoff.
async function fetchWithRetry(url, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.ok) return res;

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

export async function fetchJson(url, opts) {
  const res = await fetchWithRetry(url, opts);
  return res.json();
}

// Returns text, for the sitemap (XML) and District event pages (HTML). Shares
// the retry/backoff policy since the per-event page fetch is now load-bearing.
export async function fetchText(url, opts) {
  const res = await fetchWithRetry(url, opts);
  return res.text();
}
