#!/usr/bin/env node
// Converts a Cloudflare worker repository_dispatch payload (DISPATCH_PAYLOAD env)
// into agents/pib-latest.json + detection fingerprints, mirroring the shape
// produced by agents/pib-scanner.js for the scheduled path.
// Extracted from scheme-detector.yml: an inline `node <<'JS'` heredoc there sat
// inside an if-block, so the indented terminator never matched and the step
// died with "syntax error: unexpected end of file" on every dispatch.
import fs from "node:fs";

const payload = JSON.parse(process.env.DISPATCH_PAYLOAD || "{}");
const detections = payload.detections || [];

const categoryMap = {
  scheme: "NEW_SCHEME_OR_LAUNCH",
  "policy-change": "POLICY_CHANGE",
  "digital-service": "DIGITAL_SERVICE",
};

const items = detections.map(d => {
  const text = `${d.title || ""} ${d.url || ""}`.toLowerCase();
  let category = "DIGITAL_SERVICE";
  if (/scheme|yojana|subsidy|beneficiary|dbt|pension|scholarship|loan|insurance|awas|ayushman|ujjwala|mudra|kisan|pm[- ]?surya|solar|आवास|किसान|योजना|सब्सिडी|पेंशन/.test(text)) {
    category = "NEW_SCHEME_OR_LAUNCH";
  } else if (/deadline|extended|revised|amendment|guidelines|new rules|fee|charges|tax|last date|registration|अंतिम तिथि|विस्तार|संशोधित|शुल्क/.test(text)) {
    category = "POLICY_CHANGE";
  }
  return {
    title: d.title,
    link: d.url,
    description: d.title,
    source: d.sourceId,
    sourceName: d.sourceName || "Official feed",
    lang: d.sourceId === "pib" ? "hi" : "en",
    category: categoryMap[d.category] || category,
  };
});

fs.mkdirSync("agents", { recursive: true });
fs.writeFileSync(
  "agents/pib-latest.json",
  JSON.stringify(
    {
      scanTime: new Date().toISOString(),
      totalItems: detections.length,
      newItems: detections.length,
      relevantItems: items.length,
      items,
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  "agents/.cloudflare-detection-fingerprints",
  detections.map(d => d.fingerprint).filter(Boolean).join("\n"),
);
console.log(`Cloudflare scheme detections: ${items.length}`);
