// UC-ingest pulls from the Underline Center Discourse calendar only — every
// community is a different slice (by keyword/author) of the same forum.
export const BASE_URL = "https://underline.center";
export const CALENDAR_URL = "https://underline.center/c/calendar/5.json";
export const VENUE = "Underline Center, Indiranagar";
export const TAGS = ["UC"];
export const COMMUNITIES_CONFIG = "communities.json";

// District is a second discovery source (opt-in per community via a "district"
// block in communities.json). Events go live on District, our ticketing
// partner, often before they reach the Discourse calendar; we surface those.
//
// Discovery uses District's public event sitemap (the only complete public
// index — the brand's embedded upcoming_events list is curated/incomplete, and
// every brand/search listing API requires auth).
//
// The per-event detail comes from the public event page rather than the
// getBySlug API: the API host (api-events.district.in) geoblocks non-India IPs,
// which breaks GitHub Actions runners, but the page host (www.district.in) is
// CDN-served with no geofence and embeds the exact same payload as Next.js RSC
// flight data. Scraping the page keeps the District build working in CI.
export const DISTRICT_SITEMAP =
  "https://www.district.in/events/search-sitemap/event-detail-pages.xml";
export const districtEventPageUrl = (slug) =>
  `https://www.district.in/events/${slug}-buy-tickets`;

// States worth surfacing. sold_out is kept (a sold-out show is still a real
// listing); anything that is not a live ticketed offering is skipped.
export const DISTRICT_SHOWABLE = new Set([
  "available",
  "sold_out",
  "coming_soon",
  "tba",
]);
