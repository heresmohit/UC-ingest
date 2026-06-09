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
// every brand/search listing API requires auth). The per-event detail comes
// from the same getBySlug endpoint the website's ticket button already uses.
export const DISTRICT_API = "https://api-events.district.in/event/getBySlug/";
export const DISTRICT_SITEMAP =
  "https://www.district.in/events/search-sitemap/event-detail-pages.xml";

// States worth surfacing. sold_out is kept (a sold-out show is still a real
// listing); anything that is not a live ticketed offering is skipped.
export const DISTRICT_SHOWABLE = new Set([
  "available",
  "sold_out",
  "coming_soon",
  "tba",
]);
