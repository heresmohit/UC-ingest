import { DatabaseSync } from "node:sqlite";
import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { normTitle } from "./merge.js";
import { VENUE } from "./config.js";

export const BLR_TODAY_RELEASE_URL =
  "https://github.com/blr-today/dataset/releases/latest/download/events.db";
export const DEFAULT_DB_PATH = "events.db";

/**
 * Download the latest blr.today events.db SQLite dataset if missing or forced.
 */
export async function downloadEventsDb(destPath = DEFAULT_DB_PATH, { force = false } = {}) {
  if (!force && existsSync(destPath)) {
    return destPath;
  }

  console.log(`Downloading events.db from ${BLR_TODAY_RELEASE_URL} -> ${destPath}...`);
  const res = await fetch(BLR_TODAY_RELEASE_URL, {
    redirect: "follow",
    headers: { "User-Agent": "UC-ingest/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to download events.db: HTTP ${res.status} ${res.statusText}`);
  }

  const tmpPath = `${destPath}.tmp-${Date.now()}`;
  const out = createWriteStream(tmpPath);
  await pipeline(Readable.fromWeb(res.body), out);

  const { rename } = await import("node:fs/promises");
  await rename(tmpPath, destPath);
  console.log(`Downloaded events.db successfully to ${destPath}`);
  return destPath;
}

/**
 * Filter matching logic for Improv Lore events.
 */
export function isImprovLoreEvent(eventJson, row = {}) {
  let data = eventJson;
  if (typeof data === "string") {
    if (/improv\s*lore/i.test(data) || /improvlore/i.test(data)) {
      return true;
    }
    try {
      data = JSON.parse(data);
    } catch {
      return false;
    }
  }

  if (!data || typeof data !== "object") return false;

  // 1. keywords array contains "IMPROV LORE"
  if (Array.isArray(data.keywords)) {
    if (data.keywords.some((k) => typeof k === "string" && /improv\s*lore/i.test(k))) {
      return true;
    }
  }

  // 2. Organizer mentions "Improv Lore"
  const org = data.organizer;
  const orgName = typeof org === "string" ? org : org?.name;
  if (typeof orgName === "string" && /improv\s*lore/i.test(orgName)) {
    return true;
  }

  // 3. Description mentions "Improv Lore"
  if (typeof data.description === "string" && /improv\s*lore/i.test(data.description)) {
    return true;
  }

  // 4. Name / Title mentions "Improv Lore"
  if (typeof data.name === "string" && /improv\s*lore/i.test(data.name)) {
    return true;
  }

  // 5. URL mentions "improv-lore" or "improvlore"
  if (typeof data.url === "string" && /improv-?lore/i.test(data.url)) {
    return true;
  }

  return false;
}

/**
 * Derive tag based on exact rules:
 * - "show" if title contains "Show", "TheatreSports", "Panchatantra", "Reincarnations", "Silliest"
 * - "jam" if title contains "Jam", "Stage", "Whimsical", "Whimsy"
 * - "workshop" if title contains "Workshop", "Course", "101", "Essentials"
 */
export function deriveTag(title = "", description = "") {
  const t = title || "";
  const d = description || "";

  // Title checks
  if (/\b(workshop|course|101|essentials)\b/i.test(t)) return "workshop";
  if (/\b(jam|stage|whimsical|whimsy)\b/i.test(t)) return "jam";
  if (/\b(show|theatresports|theatersports|panchatantra|reincarnations|silliest)\b/i.test(t)) return "show";

  // Description fallback
  if (/\b(workshop|course|101|essentials)\b/i.test(d)) return "workshop";
  if (/\b(jam|stage|whimsical|whimsy)\b/i.test(d)) return "jam";
  if (/\b(show|theatresports|theatersports|panchatantra|reincarnations|silliest)\b/i.test(d)) return "show";

  return "show";
}

/**
 * Clean description: strips HTML tags and troupe boilerplate.
 */
export function cleanDescription(text) {
  if (!text) return null;
  let cleaned = text
    .replace(/<div class="lightbox-wrapper">[\s\S]*?<\/div>/g, "")
    .replace(/<h[1-6][^>]*>[\s\S]*?Who are Improv Lore\?[\s\S]*$/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "’")
    .replace(/&quot;/g, '"');

  cleaned = cleaned
    .replace(/Who Are Improv\s?Lore\?[\s\S]*$/i, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();

  return cleaned || null;
}

/**
 * Extract cleaned first paragraph or summary of event.description.
 */
export function extractExcerpt(cleanedDescription) {
  if (!cleanedDescription) return null;
  const paragraphs = cleanedDescription
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paragraphs[0] || null;
}

/**
 * Extract best ticketing URL: inspects event.offers and event.sameAs,
 * prioritizing https://*.district.in/* URLs.
 */
export function extractTicketUrl(eventData) {
  const urls = [];

  const collectOfferUrl = (offer) => {
    if (!offer || typeof offer !== "object") return;
    if (typeof offer.url === "string") urls.push(offer.url);
    if (Array.isArray(offer.offers)) {
      for (const sub of offer.offers) collectOfferUrl(sub);
    }
  };

  if (Array.isArray(eventData.offers)) {
    for (const o of eventData.offers) collectOfferUrl(o);
  } else if (eventData.offers && typeof eventData.offers === "object") {
    collectOfferUrl(eventData.offers);
  }

  if (Array.isArray(eventData.sameAs)) {
    urls.push(...eventData.sameAs);
  } else if (typeof eventData.sameAs === "string") {
    urls.push(eventData.sameAs);
  }

  const cleanUrls = urls
    .filter((u) => typeof u === "string" && u.trim().startsWith("http"))
    .map((u) => u.trim());

  // Priority 1: district.in/.../event link
  const districtEventUrl = cleanUrls.find((u) =>
    /https?:\/\/(?:www\.)?district\.in\/[^/]+\/event\b/i.test(u)
  );
  if (districtEventUrl) return districtEventUrl;

  // Priority 2: any district.in URL (e.g. /events/<slug>-buy-tickets converted to /<slug>/event)
  const anyDistrictUrl = cleanUrls.find((u) =>
    /https?:\/\/(?:[a-zA-Z0-9-]+\.)?district\.in\//i.test(u)
  );
  if (anyDistrictUrl) {
    const m = anyDistrictUrl.match(/\/events\/([^/]+)-buy-tickets/i);
    if (m) {
      return `https://district.in/${m[1]}/event`;
    }
    return anyDistrictUrl;
  }

  // Priority 3: external ticket URLs (BookMyShow, etc.)
  const externalTicket = cleanUrls.find((u) => !/underline\.center/i.test(u));
  if (externalTicket) return externalTicket;

  return null;
}

/**
 * Extract original discussion/forum URL (event.url, e.g. underline.center/t/...).
 */
export function extractLearnMoreUrl(eventData, rowUrl, ticketUrl) {
  const sameAs = Array.isArray(eventData.sameAs)
    ? eventData.sameAs
    : typeof eventData.sameAs === "string"
    ? [eventData.sameAs]
    : [];

  if (eventData.url && /underline\.center\/t\//i.test(eventData.url)) {
    return eventData.url;
  }
  if (rowUrl && /underline\.center\/t\//i.test(rowUrl)) {
    return rowUrl;
  }
  const forumInSameAs = sameAs.find(
    (u) => typeof u === "string" && /underline\.center\/t\//i.test(u)
  );
  if (forumInSameAs) return forumInSameAs;

  const buyTickets = sameAs.find(
    (u) => typeof u === "string" && /district\.in\/events\/.*-buy-tickets/i.test(u)
  );
  if (buyTickets) return buyTickets;

  return eventData.url || rowUrl || ticketUrl || null;
}

/**
 * First high-res URL from event.image array or single string.
 */
export function extractImageUrl(eventData) {
  if (typeof eventData.image === "string" && eventData.image.startsWith("http")) {
    return eventData.image;
  }
  if (Array.isArray(eventData.image) && eventData.image.length > 0) {
    for (const img of eventData.image) {
      if (typeof img === "string" && img.startsWith("http")) return img;
      if (img && typeof img === "object" && typeof img.url === "string") return img.url;
    }
  }
  return null;
}

/**
 * Format venue name.
 */
export function extractVenue(eventData) {
  const locName =
    eventData.location?.name ||
    (typeof eventData.location === "string" ? eventData.location : null);
  if (!locName) return VENUE;
  if (/^underline center$/i.test(locName.trim())) {
    return VENUE;
  }
  return locName.trim();
}

/**
 * Normalized kebab-case slug of title.
 */
export function slugify(str) {
  return (str || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * ISO 8601 UTC date string.
 */
export function toIsoUtc(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Extract, filter, deduplicate, and normalize Improv Lore events from blr.today SQLite database.
 */
export function extractBlrTodayEvents(dbPath = DEFAULT_DB_PATH, { filterFuture = true } = {}) {
  const db = new DatabaseSync(dbPath, { readOnly: true });

  const rows = db
    .prepare(
      `SELECT id, url, event_json FROM events
       WHERE event_json LIKE '%improv lore%' COLLATE NOCASE
          OR event_json LIKE '%improvlore%' COLLATE NOCASE`
    )
    .all();

  const now = Date.now();
  const parsedRecords = [];

  for (const r of rows) {
    let data;
    try {
      data = JSON.parse(r.event_json);
    } catch {
      continue;
    }

    if (!isImprovLoreEvent(data, r)) continue;

    const startsAt = toIsoUtc(data.startDate);
    const endsAt = toIsoUtc(data.endDate);
    if (!startsAt) continue;

    const endTs = endsAt ? new Date(endsAt).getTime() : new Date(startsAt).getTime();
    if (filterFuture && endTs < now) continue;

    parsedRecords.push({ row: r, data, startsAt, endsAt });
  }

  // Deduplicate: Group by event date (day in UTC) and normalized title.
  // Multiple rows can exist for the same event (e.g. Underline Center forum topic + District ticketing entry).
  const groups = new Map();
  for (const item of parsedRecords) {
    const { data, startsAt, endsAt, row } = item;
    const titleKey = normTitle(data.name);
    const dateKey = startsAt.slice(0, 10);
    const groupKey = `${titleKey}__${dateKey}`;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey).push(item);
  }

  const mergedEvents = [];
  for (const items of groups.values()) {
    // Select best values across duplicates
    let bestTitle = "";
    let bestAuthor = null;
    let bestDesc = "";
    let bestImage = null;
    let startsAt = items[0].startsAt;
    let endsAt = null;
    let venue = VENUE;
    let ticketUrl = null;
    let learnMore = null;

    for (const { data, row, startsAt: s, endsAt: e } of items) {
      const title = (data.name || "").replace(/\s+/g, " ").trim();
      if (title.length > bestTitle.length) bestTitle = title;

      const author = data.author?.name || (typeof data.author === "string" ? data.author : null);
      if (author && !bestAuthor) bestAuthor = author;

      const desc = cleanDescription(data.description);
      if (desc && desc.length > bestDesc.length) bestDesc = desc;

      const img = extractImageUrl(data);
      if (img && !bestImage) bestImage = img;

      if (!endsAt && e) endsAt = e;
      if (s) startsAt = s;

      const v = extractVenue(data);
      if (v) venue = v;

      const tUrl = extractTicketUrl(data);
      if (tUrl && (!ticketUrl || /district\.in/i.test(tUrl))) {
        ticketUrl = tUrl;
      }

      const lUrl = extractLearnMoreUrl(data, row.url, ticketUrl);
      if (lUrl && (!learnMore || /underline\.center\/t\//i.test(lUrl))) {
        learnMore = lUrl;
      }
    }

    const excerpt = extractExcerpt(bestDesc);
    const tag = deriveTag(bestTitle, bestDesc);

    mergedEvents.push({
      title: bestTitle,
      author: bestAuthor,
      excerpt,
      full_content: bestDesc,
      image_url: bestImage,
      event_starts_at: startsAt,
      event_ends_at: endsAt,
      venue,
      url: ticketUrl,
      learn_more: learnMore || ticketUrl,
      base_slug: slugify(bestTitle),
      tags: ["UC", tag],
    });
  }

  // Sort by event_starts_at ascending
  mergedEvents.sort((a, b) => new Date(a.event_starts_at) - new Date(b.event_starts_at));

  // Count base slugs to format unique slugs
  const slugCounts = new Map();
  for (const ev of mergedEvents) {
    slugCounts.set(ev.base_slug, (slugCounts.get(ev.base_slug) || 0) + 1);
  }

  const seenSlugs = new Set();
  const finalEvents = mergedEvents.map((ev) => {
    let slug = ev.base_slug;
    if (seenSlugs.has(slug) || (slugCounts.get(ev.base_slug) || 0) > 1) {
      // Multiple occurrences of the same show title: append date stamp
      const dateStamp = ev.event_starts_at.slice(0, 10).replace(/-/g, "");
      if (seenSlugs.has(slug)) {
        slug = `${ev.base_slug}-${dateStamp}`;
      }
    }
    seenSlugs.add(slug);

    const { base_slug, ...rest } = ev;
    return { ...rest, slug };
  });

  return finalEvents;
}
