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
  const response = await worker.fetch(new Request("https://local.test/opportunities?tier=2&dryRun=1"), {
    MONITOR_STATE: kv,
    MONITOR_ADMIN_TOKEN: "local-test",
    FIXTURE_RESPONSES: JSON.stringify({ [PIB_RSS_URL]: pibRssXml })
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

console.log("deterministic detection tests passed");
