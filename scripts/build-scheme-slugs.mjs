#!/usr/bin/env node
/**
 * Give every scheme an SEO-friendly descriptive slug derived from its name
 * (like the guides: /scheme/pradhan-mantri-mudra-yojana, not /scheme/pmmy).
 * Keeps the myScheme short code as `msSlug` so detail files (keyed by it)
 * still resolve. Rewrites myscheme.json + rekeys scheme-guide-map.json.
 *
 *   node scripts/build-scheme-slugs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MS = path.join(ROOT, "data", "schemes", "myscheme.json");
const MAP = path.join(ROOT, "data", "schemes", "scheme-guide-map.json");

const STATE_ABBR = {}; // (states already appear in names)

function slugify(t) {
  return String(t).toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
// keep it readable: cap at ~9 words / 75 chars, cut on a word boundary
function descriptiveSlug(name) {
  let s = slugify(name);
  if (s.length > 75) {
    s = s.slice(0, 75);
    s = s.slice(0, s.lastIndexOf("-")); // don't cut mid-word
  }
  return s.replace(/^-|-$/g, "") || "scheme";
}

function main() {
  const schemes = JSON.parse(fs.readFileSync(MS, "utf8"));
  const taken = new Set();
  const oldToNew = {};
  for (const s of schemes) {
    const oldSlug = s.slug ?? s.id;
    s.msSlug = s.msSlug || oldSlug;          // preserve myScheme code for detail lookup
    let slug = descriptiveSlug(s.name);
    if (taken.has(slug)) {                    // dedupe collisions
      let n = 2;
      while (taken.has(`${slug}-${n}`)) n++;
      slug = `${slug}-${n}`;
    }
    taken.add(slug);
    s.slug = slug;
    s.guidePath = `/scheme/${slug}`;
    oldToNew[oldSlug] = slug;
  }
  fs.writeFileSync(MS, JSON.stringify(schemes, null, 2));

  // rekey scheme→guide map from old short slug to new descriptive slug
  if (fs.existsSync(MAP)) {
    const m = JSON.parse(fs.readFileSync(MAP, "utf8"));
    const rekeyed = {};
    for (const [oldSlug, guide] of Object.entries(m)) {
      const ns = oldToNew[oldSlug] || oldSlug;
      rekeyed[ns] = guide;
    }
    fs.writeFileSync(MAP, JSON.stringify(rekeyed, null, 2));
  }

  console.log(`reslugged ${schemes.length} schemes`);
  console.log("samples:");
  for (const s of schemes.slice(0, 6)) console.log(`  ${s.msSlug} -> /scheme/${s.slug}`);
}
void STATE_ABBR;
main();
