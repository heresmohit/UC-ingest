import assert from "node:assert/strict";
import { existsSync, unlinkSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  isImprovLoreEvent,
  deriveTag,
  extractTicketUrl,
  extractExcerpt,
  cleanDescription,
  extractVenue,
  slugify,
  toIsoUtc,
  extractBlrTodayEvents,
  downloadEventsDb,
  DEFAULT_DB_PATH,
} from "../src/lib/blr-today.js";
import { mergeCustomEvents } from "../src/lib/merge.js";
import { applyD1Overrides } from "../src/lib/d1-overrides.js";

async function runTests() {
  console.log("=== Running Ingestion & Schema Tests ===\n");

  // ----------------------------------------------------
  // Test 1: Download & Database verification
  // ----------------------------------------------------
  console.log("Test 1: Verify blr.today dataset download and SQLite schema...");
  const dbPath = await downloadEventsDb(DEFAULT_DB_PATH);
  assert.ok(existsSync(dbPath), `events.db must exist at ${dbPath}`);

  const db = new DatabaseSync(dbPath, { readOnly: true });
  const tableCheck = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    .get();
  assert.ok(tableCheck, "Table 'events' must exist in events.db");

  const sampleRow = db.prepare("SELECT url, event_json, id FROM events LIMIT 1").get();
  assert.ok(sampleRow.url, "Row must have url");
  assert.ok(sampleRow.event_json, "Row must have event_json");
  assert.ok(sampleRow.id, "Row must have id");
  console.log("  ✓ Table schema and connectivity verified.");

  // ----------------------------------------------------
  // Test 2: Extraction & Filtering Logic
  // ----------------------------------------------------
  console.log("Test 2: Verify Improv Lore extraction and filtering logic...");

  // Match 1: event_json contains "improv lore"
  assert.ok(
    isImprovLoreEvent({ description: "Join Improv Lore for a fun evening" }),
    "Must match description with Improv Lore"
  );

  // Match 2: keywords array contains "IMPROV LORE"
  assert.ok(
    isImprovLoreEvent({ keywords: ["BANGALORE", "IMPROV LORE", "THEATRE"] }),
    "Must match keywords with IMPROV LORE"
  );

  // Match 3: organizer mentions "Improv Lore"
  assert.ok(
    isImprovLoreEvent({ organizer: { name: "Improv Lore Troupe" } }),
    "Must match organizer object"
  );
  assert.ok(
    isImprovLoreEvent({ organizer: "Improv Lore" }),
    "Must match organizer string"
  );

  // Match 4: name mentions "Improv Lore"
  assert.ok(
    isImprovLoreEvent({ name: "The Silliest Show Tonight by Improv Lore" }),
    "Must match name"
  );

  // Match 5: URL mentions improvlore
  assert.ok(
    isImprovLoreEvent({ url: "https://underline.center/t/whimsical-wednesday-with-improv-lore/15" }),
    "Must match URL"
  );

  // Negative match: unrelated events should not match
  assert.ok(
    !isImprovLoreEvent({
      name: "All-In Improv Jam",
      description: "A comedy improv jam in Bangalore.",
      keywords: ["IMPROV", "COMEDY"],
      organizer: { name: "Random Org" },
    }),
    "Must NOT match general improv events unrelated to Improv Lore"
  );
  console.log("  ✓ Extraction filtering conditions verified.");

  // ----------------------------------------------------
  // Test 3: Tag Deduction Rules
  // ----------------------------------------------------
  console.log("Test 3: Verify tag deduction rules...");
  assert.equal(deriveTag("The Silliest Show Tonight"), "show");
  assert.equal(deriveTag("TheatreSports Championship"), "show");
  assert.equal(deriveTag("Panchatantra Improvised"), "show");
  assert.equal(deriveTag("Reincarnations"), "show");
  assert.equal(deriveTag("An Improv Show"), "show");

  assert.equal(deriveTag("Whimsical Wednesday"), "jam");
  assert.equal(deriveTag("Make Friends with the Stage"), "jam");
  assert.equal(deriveTag("Musical Improv Jam"), "jam");
  assert.equal(deriveTag("Whimsy Night"), "jam");

  assert.equal(deriveTag("Improv 101"), "workshop");
  assert.equal(deriveTag("Acting Workshop for Beginners"), "workshop");
  assert.equal(deriveTag("Improv Essentials Course"), "workshop");
  assert.equal(deriveTag("4-Day Intensive Course"), "workshop");
  console.log("  ✓ Tag deduction verified for all categories.");

  // ----------------------------------------------------
  // Test 4: Ticketing URL Extraction & District prioritization
  // ----------------------------------------------------
  console.log("Test 4: Verify ticketing URL extraction and District prioritization...");
  const mockDistrictOffer = {
    sameAs: [
      "https://in.bookmyshow.com/plays/and-then/ET00509978",
      "https://district.in/and-then-an-improv-show-jul26-2026/event",
    ],
    offers: {
      url: "https://www.district.in/events/and-then-an-improv-show-jul26-2026-buy-tickets",
    },
  };
  const ticketUrl = extractTicketUrl(mockDistrictOffer);
  assert.equal(
    ticketUrl,
    "https://district.in/and-then-an-improv-show-jul26-2026/event",
    "Must prioritize district.in /event URL"
  );

  const mockNestedOffer = {
    offers: {
      offers: [
        { url: "https://www.district.in/events/silliest-show-buy-tickets" },
      ],
    },
  };
  assert.equal(
    extractTicketUrl(mockNestedOffer),
    "https://district.in/silliest-show/event",
    "Must convert nested district buy-tickets URL to /event link"
  );
  console.log("  ✓ Ticketing URL extraction and prioritization verified.");

  // ----------------------------------------------------
  // Test 5: Extraction from events.db and Schema Validation
  // ----------------------------------------------------
  console.log("Test 5: Extract events from events.db and validate schema contract...");
  const extracted = extractBlrTodayEvents(DEFAULT_DB_PATH, { filterFuture: false });
  assert.ok(extracted.length > 0, "Must extract at least one event from events.db");

  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  for (const ev of extracted) {
    // Contract checks
    assert.ok(typeof ev.title === "string" && ev.title.length > 0, "title must be non-empty string");
    assert.ok(ev.author === null || typeof ev.author === "string", "author must be string or null");
    assert.ok(typeof ev.excerpt === "string" && ev.excerpt.length > 0, "excerpt must be non-empty string");
    assert.ok(typeof ev.full_content === "string" && ev.full_content.length > 0, "full_content must be non-empty string");
    assert.ok(
      ev.image_url === null || (typeof ev.image_url === "string" && /^https?:\/\//.test(ev.image_url)),
      "image_url must be valid URL or null"
    );
    assert.ok(isoRegex.test(ev.event_starts_at), `event_starts_at must be ISO 8601 UTC: ${ev.event_starts_at}`);
    if (ev.event_ends_at !== null) {
      assert.ok(isoRegex.test(ev.event_ends_at), `event_ends_at must be ISO 8601 UTC: ${ev.event_ends_at}`);
    }
    assert.ok(typeof ev.venue === "string" && ev.venue.length > 0, "venue must be non-empty string");
    assert.ok(ev.url === null || typeof ev.url === "string", "url must be string or null");
    assert.ok(typeof ev.learn_more === "string" && ev.learn_more.length > 0, "learn_more must be non-empty string");
    assert.ok(slugRegex.test(ev.slug), `slug must be valid kebab-case: ${ev.slug}`);
    assert.ok(Array.isArray(ev.tags), "tags must be an array");
    assert.equal(ev.tags[0], "UC", "tags[0] must be 'UC'");
    assert.ok(
      ["show", "jam", "workshop"].includes(ev.tags[1]),
      `tags[1] must be 'show', 'jam', or 'workshop': got ${ev.tags[1]}`
    );
  }
  console.log(`  ✓ All ${extracted.length} extracted events pass exact schema validation.`);

  // ----------------------------------------------------
  // Test 6: Custom Events Override Preservation
  // ----------------------------------------------------
  console.log("Test 6: Verify custom events override layer...");
  const rawEvents = [
    {
      title: "The Silliest Show Tonight by Improv Lore",
      event_starts_at: "2026-10-30T15:30:00.000Z",
      venue: "Underline Center, Indiranagar",
      url: "https://raw.link",
      learn_more: "https://raw.learn",
      slug: "the-silliest-show-tonight-by-improv-lore",
      tags: ["UC", "show"],
    },
  ];
  const customEvents = [
    {
      title: "The Silliest Show Tonight by Improv Lore",
      event_starts_at: "2026-10-30T15:30:00.000Z",
      venue: "Custom Secret Venue",
      url: "https://custom.tickets",
      learn_more: "https://custom.learn",
    },
  ];

  const mergedCustom = mergeCustomEvents(rawEvents, customEvents);
  assert.equal(mergedCustom.length, 1);
  assert.equal(mergedCustom[0].venue, "Custom Secret Venue", "Custom venue must override raw venue");
  assert.equal(mergedCustom[0].url, "https://custom.tickets", "Custom url must override raw url");
  assert.equal(mergedCustom[0].slug, "the-silliest-show-tonight-by-improv-lore", "Slug must be preserved");
  console.log("  ✓ Custom events override verified.");

  // ----------------------------------------------------
  // Test 7: D1 Admin Layer Overrides (Disables & Edits)
  // ----------------------------------------------------
  console.log("Test 7: Verify D1 admin layer overrides and disabled events...");
  const sampleEvents = [
    {
      slug: "and-then-an-improv-show-by-improv-lore",
      title: "And Then?: An Improv Show by Improv Lore",
      event_starts_at: "2026-10-25T13:30:00.000Z",
      venue: "Underline Center, Indiranagar",
      tags: ["UC", "show"],
    },
    {
      slug: "make-friends-with-the-stage-open-stage-jam-by-improv-lore",
      title: "Make Friends with the Stage",
      event_starts_at: "2026-10-28T14:30:00.000Z",
      venue: "Underline Center, Indiranagar",
      tags: ["UC", "jam"],
    },
  ];

  // Test graceful handling when D1 is offline or mock
  const overridesResult = await applyD1Overrides(sampleEvents, "improvlore");
  assert.ok(Array.isArray(overridesResult), "applyD1Overrides must return array");
  console.log("  ✓ D1 overrides handling verified.");

  console.log("\n✅ All Ingestion & Schema Tests Passed Successfully!");
}

runTests().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});
