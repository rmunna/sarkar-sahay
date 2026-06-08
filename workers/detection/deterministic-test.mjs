import assert from "node:assert/strict";
import worker from "./index.mjs";

class MemoryKV {
  constructor() {
    this.map = new Map();
  }
  async get(key) {
    return this.map.get(key) || null;
  }
  async put(key, value) {
    this.map.set(key, value);
  }
}

const RRB_URL = "https://www.rrbcdg.gov.in/";
const CBSE_PRIMARY_URL = "https://results.cbse.nic.in/";
const CBSE_FALLBACK_URL = "https://www.cbseresults.nic.in/";
const PIB_RSS_URL = "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3";
const GOOGLE_TRENDS_RSS_URL = "https://trends.google.com/trending/rss?geo=IN";

const baselineHtml = `
  <html>
    <body>
      <div id="visitor">Visitor Count: 123456</div>
      <a href="/uploads/CEN-01-2026-notification.pdf?utm_source=footer">
        CEN 01/2026 Recruitment Notification
      </a>
      <a href="/privacy-policy">Privacy Policy</a>
      <a href="/tender-2026.pdf">Tender Notice</a>
    </body>
  </html>
`;

const noiseOnlyHtml = `
  <html>
    <body>
      <div id="visitor">Visitor Count: 999999</div>
      <a href="/uploads/CEN-01-2026-notification.pdf?utm_source=homepage&cache=999">
        CEN 01/2026 Recruitment Notification
      </a>
      <a href="/privacy-policy">Privacy Policy Updated</a>
      <a href="/tender-2026.pdf">Tender Notice</a>
    </body>
  </html>
`;

const realNewHtml = `
  <html>
    <body>
      <div id="visitor">Visitor Count: 999999</div>
      <a href="/uploads/CEN-01-2026-notification.pdf?utm_source=homepage&cache=999">
        CEN 01/2026 Recruitment Notification
      </a>
      <a href="/uploads/CEN-02-2026-result.pdf">
        CEN 02/2026 Result Notice
      </a>
    </body>
  </html>
`;

const cbseFallbackHtml = `
  <html>
    <body>
      <h1>Central Board of Secondary Education Examination Results 2026</h1>
      <a href="/class_x_jj_2026_de/ClassTenth_xy_2026.htm">
        Secondary School Examination (Class X) Results 2026 - Announced on 15th April 2026
      </a>
      <a href="/class_xii_2026/ClassTwelfth_2026.htm?utm_source=home">
        Senior School Certificate Examination (Class XII) Results 2026 - Announced on 13th May 2026
      </a>
    </body>
  </html>
`;

const pibRssXml = `
  <rss><channel>
    <item>
      <title><![CDATA[PM Surya Ghar portal registration deadline extended for subsidy beneficiaries]]></title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=12345</link>
      <pubDate>Mon, 08 Jun 2026 10:00:00 GMT</pubDate>
      <description><![CDATA[Citizens can apply online for rooftop solar subsidy.]]></description>
    </item>
    <item>
      <title><![CDATA[Auction of Government Securities announced]]></title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=12346</link>
      <pubDate>Mon, 08 Jun 2026 11:00:00 GMT</pubDate>
      <description><![CDATA[Market operation notice.]]></description>
    </item>
  </channel></rss>
`;

const googleTrendsRssXml = `
  <rss xmlns:ht="https://trends.google.com/trending/rss">
    <channel>
      <item>
        <title>csbc</title>
        <ht:approx_traffic>1000+</ht:approx_traffic>
        <pubDate>Sun, 7 Jun 2026 16:30:00 -0700</pubDate>
        <ht:news_item>
          <ht:news_item_title>CSBC Bihar Constable Admit Card 2026 Out: Check Hall Ticket Link And Exam Details</ht:news_item_title>
          <ht:news_item_url>https://www.ndtv.com/education/csbc-bihar-constable-admit-card-2026-out-check-hall-ticket-link-and-exam-details-11596238</ht:news_item_url>
          <ht:news_item_source>NDTV</ht:news_item_source>
        </ht:news_item>
        <ht:news_item>
          <ht:news_item_title>Bihar Daroga Vacancy 2026: 20,937 New SI Posts Approved</ht:news_item_title>
          <ht:news_item_url>https://www.adda247.com/exams/bihar/bihar-daroga-vacancy-2026-20937-new-si-posts-approved/</ht:news_item_url>
          <ht:news_item_source>Adda247</ht:news_item_source>
        </ht:news_item>
        <ht:news_item>
          <ht:news_item_title>Bihar Police Constable Final Results 2026 Released at csbc.bihar.gov.in</ht:news_item_title>
          <ht:news_item_url>https://www.jagranjosh.com/articles/bihar-police-constable-final-result-2026-released-at-csbc-bihar-gov-in-check-merit-list-pdf-here-1800012237-1</ht:news_item_url>
          <ht:news_item_source>Jagran Josh</ht:news_item_source>
        </ht:news_item>
      </item>
      <item>
        <title>mas vs oma</title>
        <ht:approx_traffic>500+</ht:approx_traffic>
        <pubDate>Sun, 7 Jun 2026 16:00:00 -0700</pubDate>
        <ht:news_item>
          <ht:news_item_title>Cricket match live score updates</ht:news_item_title>
        </ht:news_item>
      </item>
    </channel>
  </rss>
`;

async function scan(kv, html) {
  const response = await worker.fetch(new Request("https://local.test/scan?source=rrb", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    MIN_DISPATCH_CONFIDENCE: "0.75",
    FIXTURE_RESPONSES: JSON.stringify({ [RRB_URL]: html })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function scanWithFixtureError(kv) {
  const response = await worker.fetch(new Request("https://local.test/scan?source=rrb", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({ [RRB_URL]: { error: "fixture network failure" } })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function status(kv) {
  const response = await worker.fetch(new Request("https://local.test/sources/status", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test"
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function scanCbseWithFallback(kv) {
  const response = await worker.fetch(new Request("https://local.test/scan?source=cbse-results", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({
      [CBSE_PRIMARY_URL]: { error: "primary blocked" },
      [CBSE_FALLBACK_URL]: cbseFallbackHtml
    })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function scanOpportunities(kv) {
  const response = await worker.fetch(new Request("https://local.test/opportunities?tier=2&source=pib&dryRun=1"), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({ [PIB_RSS_URL]: pibRssXml })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function persistOpportunities(kv) {
  const response = await worker.fetch(new Request("https://local.test/opportunities?tier=2&source=pib&dryRun=0", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({ [PIB_RSS_URL]: pibRssXml })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function readOpportunityQueue(kv) {
  const response = await worker.fetch(new Request("https://local.test/opportunities/queue", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test"
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function scanTrendSignals(kv) {
  const response = await worker.fetch(new Request("https://local.test/trend-signals?dryRun=1"), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({ [GOOGLE_TRENDS_RSS_URL]: googleTrendsRssXml })
  });
  assert.equal(response.status, 200);
  return response.json();
}

async function persistTrendSignals(kv) {
  const response = await worker.fetch(
    new Request("https://local.test/trend-signals?dryRun=0", {
      headers: { Authorization: "Bearer local-test" }
    }),
    {
      MONITOR_STATE: kv,
      MONITOR_ADMIN_TOKEN: "local-test",
      FIXTURE_RESPONSES: JSON.stringify({ [GOOGLE_TRENDS_RSS_URL]: googleTrendsRssXml })
    }
  );
  assert.equal(response.status, 200);
  return response.json();
}

async function readTrendWatchlist(kv) {
  const response = await worker.fetch(new Request("https://local.test/watchlist", {
    headers: { Authorization: "Bearer local-test" }
  }), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test"
  });
  assert.equal(response.status, 200);
  return response.json();
}

const kv = new MemoryKV();

const baseline = await scan(kv, baselineHtml);
assert.equal(baseline.newCount, 0, "first scan should baseline only");
assert.equal(baseline.results[0].itemCount, 1, "baseline should ignore privacy/tender noise");

const noise = await scan(kv, noiseOnlyHtml);
assert.equal(noise.newCount, 0, "visitor count and tracking query changes should not trigger");
assert.equal(noise.results[0].itemCount, 1, "noise scan should still see the same one actionable item");

const real = await scan(kv, realNewHtml);
assert.equal(real.newCount, 1, "a new official result notice should trigger exactly once");
assert.equal(real.detections[0].stage, "result", "new notice should be classified deterministically");

const afterReal = await scan(kv, realNewHtml);
assert.equal(afterReal.newCount, 0, "same new notice should not trigger twice");

const kvFailure = new MemoryKV();
const failureBaseline = await scan(kvFailure, baselineHtml);
assert.equal(failureBaseline.newCount, 0);
const failed = await scanWithFixtureError(kvFailure);
assert.equal(failed.results[0].error, "fixture network failure");
const sourceStatus = await status(kvFailure);
const rrb = sourceStatus.sources.find(source => source.id === "rrb");
assert.equal(rrb.fingerprintCount, 1, "failed scan should preserve last good fingerprints");
assert.equal(rrb.health, "degraded", "source with a previous success and current error is degraded");
const recovered = await scan(kvFailure, baselineHtml);
assert.equal(recovered.newCount, 0, "recovery after failure should not re-baseline or flood");

const kvFallback = new MemoryKV();
const cbseBaseline = await scanCbseWithFallback(kvFallback);
assert.equal(cbseBaseline.results[0].urlUsed, CBSE_FALLBACK_URL, "CBSE should use the official fallback URL");
assert.equal(cbseBaseline.results[0].itemCount, 2, "CBSE fallback should extract result links");
assert.equal(cbseBaseline.newCount, 0, "fallback first scan should baseline only");
const cbseSecond = await scanCbseWithFallback(kvFallback);
assert.equal(cbseSecond.newCount, 0, "CBSE fallback should not duplicate unchanged result links");

const opportunity = await scanOpportunities(new MemoryKV());
assert.ok(opportunity.clusterCount >= 1, "official RSS opportunity should be clustered");
assert.ok(opportunity.clusters.some(cluster => cluster.key === "pm surya"), "PM Surya item should become an opportunity cluster");
assert.equal(opportunity.clusters.some(cluster => cluster.key.includes("auction")), false, "auction noise should be skipped");
assert.ok(opportunity.opportunities.some(item => item.decision === "update_existing"), "known evergreen topics should be routed to existing-page updates");
assert.equal(opportunity.dispatchableCount, 0, "dry-run opportunity scan should not dispatch");

const kvOpportunity = new MemoryKV();
const firstOpportunityRun = await persistOpportunities(kvOpportunity);
assert.equal(firstOpportunityRun.queueUpdates.length, 1, "write-mode opportunity scan should create one queue item");
assert.equal(firstOpportunityRun.dispatchableCount, 0, "PM Surya existing-page opportunity should be held for review, not auto-dispatched");
const secondOpportunityRun = await persistOpportunities(kvOpportunity);
assert.equal(secondOpportunityRun.queueUpdates[0].status, "updated", "repeat opportunity scan should update the same queue item");
const opportunityQueue = await readOpportunityQueue(kvOpportunity);
assert.equal(opportunityQueue.count, 1, "opportunity queue should dedupe repeat official items");
assert.equal(opportunityQueue.opportunities[0].decision, "update_existing", "queue should preserve update-existing decision");
assert.equal(opportunityQueue.opportunities[0].status, "needs_review", "update-existing records require review until guide updater exists");
assert.equal(opportunityQueue.opportunities[0].existingPageMatch.slug, "/guide/pm-surya-ghar-muft-bijli");

const trendSignals = await scanTrendSignals(new MemoryKV());
assert.equal(trendSignals.itemCount, 2, "Google Trends RSS parser should read trend items");
assert.equal(trendSignals.signalCount, 1, "exam/job trend filtering should keep CSBC and drop sports noise");
assert.equal(trendSignals.signals[0].title, "csbc", "abbreviation-only trend should be retained through nested news evidence");
assert.ok(trendSignals.signals[0].matchedOrgs.includes("csbc"), "CSBC abbreviation should match known exam orgs");
assert.ok(trendSignals.signals[0].matchedKeywords.includes("admit card"), "nested news title should match admit card keyword");
assert.equal(trendSignals.signals[0].officialConfirmationRequired, true, "trend signal should require official confirmation");
assert.equal(trendSignals.signals[0].topicKey, "csbc:bihar-police-constable:admit-card:2026", "trend topic key should dedupe variants by org, subject, stage, and year");

const kvTrend = new MemoryKV();
const firstWatch = await persistTrendSignals(kvTrend);
assert.equal(firstWatch.watchUpdates.length, 1, "write-mode trend scan should create one watch topic");
assert.equal(firstWatch.watchUpdates[0].status, "created");
const secondWatch = await persistTrendSignals(kvTrend);
assert.equal(secondWatch.watchUpdates.length, 1, "repeat trend scan should update the same watch topic");
assert.equal(secondWatch.watchUpdates[0].status, "updated");
const watchlist = await readTrendWatchlist(kvTrend);
assert.equal(watchlist.watchCount, 1, "watchlist should keep one deduped CSBC topic");
assert.equal(watchlist.watchlist[0].topicKey, "csbc:bihar-police-constable:admit-card:2026");
assert.equal(watchlist.watchlist[0].seenCount, 2, "repeat sightings should increment the existing watch topic");
assert.equal(watchlist.watchlist[0].suggestedOfficialSources[0].id, "csbc-official", "watch topic should suggest the official CSBC portal");

console.log("deterministic detection tests passed");
