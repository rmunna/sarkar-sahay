#!/usr/bin/env node
/**
 * Build D1 import SQL from data/ifsc/*.json.
 *
 * Emits batched INSERT files under data/d1/ifsc/ so each file stays well under
 * wrangler's per-statement limits. Apply with:
 *   npx wrangler d1 execute citizennest-data --remote --file data/d1/schema-ifsc.sql
 *   for f in data/d1/ifsc/*.sql; do npx wrangler d1 execute citizennest-data --remote --file "$f"; done
 *
 * Usage:
 *   node scripts/build-d1-ifsc.mjs            # all banks
 *   node scripts/build-d1-ifsc.mjs --bank rbl # one bank (pilot)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "data", "ifsc");
const OUT = path.join(ROOT, "data", "d1", "ifsc");
const ROWS_PER_FILE = 5000;
// D1 rejects oversized single statements (SQLITE_TOOBIG), so cap each
// multi-row INSERT; many statements per file is fine.
const ROWS_PER_INSERT = 100;

const args = process.argv.slice(2);
const onlyBank = args.includes("--bank") ? args[args.indexOf("--bank") + 1] : null;

const q = v => `'${String(v ?? "").replace(/'/g, "''")}'`;
const bit = v => (v ? 1 : 0);

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const banks = JSON.parse(fs.readFileSync(path.join(SRC, "banks.json"), "utf8"));
  const targetBanks = onlyBank ? banks.filter(b => b.slug === onlyBank) : banks;

  // banks summary table
  const bankValues = targetBanks.map(b => `(${q(b.slug)}, ${q(b.name)}, ${b.count})`).join(",\n");
  fs.writeFileSync(
    path.join(OUT, "000-banks.sql"),
    `DELETE FROM ifsc_banks;\nINSERT INTO ifsc_banks (slug, name, count) VALUES\n${bankValues};\n`,
  );

  const cols = "(ifsc,bank,bank_slug,branch,branch_display,city,city_slug,district,state,state_slug,address,micr,contact,neft,rtgs,imps,upi,page_slug)";
  let fileIdx = 0;
  let total = 0;

  for (const bank of targetBanks) {
    const branches = JSON.parse(fs.readFileSync(path.join(SRC, `${bank.slug}.json`), "utf8"));
    for (let i = 0; i < branches.length; i += ROWS_PER_FILE) {
      const chunk = branches.slice(i, i + ROWS_PER_FILE);
      const statements = [];
      for (let j = 0; j < chunk.length; j += ROWS_PER_INSERT) {
        const rows = chunk.slice(j, j + ROWS_PER_INSERT).map(b =>
          `(${q(b.ifsc)},${q(b.bank)},${q(b.bankSlug)},${q(b.branch)},${q(b.branchDisplay)},${q(b.city)},${q(b.citySlug)},${q(b.district)},${q(b.state)},${q(b.stateSlug)},${q(b.address)},${q(b.micr)},${q(b.contact)},${bit(b.neft)},${bit(b.rtgs)},${bit(b.imps)},${bit(b.upi)},${q(b.pageSlug)})`,
        ).join(",\n");
        // INSERT OR REPLACE keeps re-imports idempotent
        statements.push(`INSERT OR REPLACE INTO ifsc_branches ${cols} VALUES\n${rows};`);
      }
      const name = `${String(++fileIdx).padStart(4, "0")}-${bank.slug}-${i}.sql`;
      fs.writeFileSync(path.join(OUT, name), statements.join("\n"));
      total += chunk.length;
    }
  }

  console.log(`banks: ${targetBanks.length} | rows: ${total} | sql files: ${fileIdx + 1} → ${path.relative(ROOT, OUT)}`);
}

main();
