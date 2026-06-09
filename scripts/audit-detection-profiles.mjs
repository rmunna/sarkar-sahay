import fs from "node:fs";
import assert from "node:assert/strict";

const WORKER_URL = process.env.DETECTION_WORKER_URL || "https://citizennest-detection.citizennest.workers.dev";
const config = JSON.parse(fs.readFileSync("workers/detection/sources.json", "utf8"));
const profiledSources = config.sources.filter(source =>
  source.strategy === "official_links" && Array.isArray(source.selectors) && source.selectors.length > 0
);

const results = [];

for (const source of profiledSources) {
  const started = Date.now();
  const { body, result, attempts } = await scanProfiledSource(source);
  const passed = Boolean(
    body.ok
      && !result.error
      && result.extractionMode === "selector"
      && Number(result.itemCount || 0) > 0
      && Array.isArray(result.matchedSelectors)
      && result.matchedSelectors.length > 0
  );

  results.push({
    sourceId: source.id,
    passed,
    itemCount: result.itemCount || 0,
    extractionMode: result.extractionMode || null,
    matchedSelectors: result.matchedSelectors || [],
    schemaChanged: Boolean(result.schemaChanged),
    error: result.error || null,
    attempts,
    durationMs: Date.now() - started
  });
}

console.table(results.map(result => ({
  source: result.sourceId,
  pass: result.passed,
  items: result.itemCount,
  mode: result.extractionMode,
  selectors: result.matchedSelectors.join(", "),
  attempts: result.attempts,
  error: result.error || ""
})));

const failed = results.filter(result => !result.passed);
if (failed.length > 0) {
  console.error(JSON.stringify({ ok: false, failed }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checked: results.length, results }, null, 2));

async function scanProfiledSource(source) {
  let lastBody = null;
  let lastResult = null;
  const maxAttempts = Number(process.env.PROFILE_AUDIT_ATTEMPTS || 2);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const url = `${WORKER_URL}/scan?source=${encodeURIComponent(source.id)}&dryRun=1`;
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    assert.equal(response.ok, true, `${source.id}: HTTP ${response.status}`);
    const body = await response.json();
    const result = body.results?.[0] || {};
    lastBody = body;
    lastResult = result;

    if (!result.error && result.extractionMode === "selector" && Number(result.itemCount || 0) > 0) {
      return { body, result, attempts: attempt };
    }
    if (attempt < maxAttempts) await new Promise(resolve => setTimeout(resolve, 2500));
  }

  return { body: lastBody, result: lastResult || {}, attempts: maxAttempts };
}
