#!/usr/bin/env node
/**
 * Build D1 import SQL from data/pincode/<state>.json (mirrors build-d1-ifsc.mjs).
 * Chunked INSERTs (100 rows/statement) to stay under D1's SQLITE_TOOBIG limit.
 *
 *   node scripts/build-d1-pincode.mjs                # all states
 *   node scripts/build-d1-pincode.mjs --state goa    # one state (pilot)
 *
 * Apply:
 *   npx wrangler d1 execute citizennest-data --remote --file data/d1/schema-pincode.sql -y
 *   for f in data/d1/pincode/*.sql; do npx wrangler d1 execute citizennest-data --remote --file "$f" -y; done
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "data", "pincode");
const OUT = path.join(ROOT, "data", "d1", "pincode");
const ROWS_PER_INSERT = 100;

const args = process.argv.slice(2);
const onlyState = args.includes("--state") ? args[args.indexOf("--state") + 1] : null;

const q = v => `'${String(v ?? "").replace(/'/g, "''")}'`;

function slugifyText(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const states = JSON.parse(fs.readFileSync(path.join(SRC, "states.json"), "utf8"));
  const targets = onlyState ? states.filter(s => s.slug === onlyState) : states;

  const cols = "(pincode,post_office,places,district,district_slug,state,state_slug,taluk,lat,lng,page_slug)";
  let fileIdx = 0, total = 0;

  for (const st of targets) {
    const file = path.join(SRC, `${st.slug}.json`);
    if (!fs.existsSync(file)) { console.warn(`skip ${st.slug}: no file`); continue; }
    const records = JSON.parse(fs.readFileSync(file, "utf8"));
    const statements = [];
    for (let j = 0; j < records.length; j += ROWS_PER_INSERT) {
      const rows = records.slice(j, j + ROWS_PER_INSERT).map(r => {
        const pageSlug = `${slugifyText(r.postOffice)}-${r.pincode}`;
        return `(${q(r.pincode)},${q(r.postOffice)},${q(JSON.stringify(r.places || []))},${q(r.district)},${q(r.districtSlug)},${q(r.state)},${q(r.stateSlug)},${q(r.taluk)},${q(r.lat)},${q(r.lng)},${q(pageSlug)})`;
      }).join(",\n");
      statements.push(`INSERT INTO pincode_places ${cols} VALUES\n${rows};`);
    }
    const name = `${String(++fileIdx).padStart(3, "0")}-${st.slug}.sql`;
    fs.writeFileSync(path.join(OUT, name), statements.join("\n"));
    total += records.length;
  }
  console.log(`states: ${targets.length} | rows: ${total} | sql files: ${fileIdx} → ${path.relative(ROOT, OUT)}`);
}

main();
