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
// SEO slug matching the top-ranked guide pattern, e.g.
//   shakti-smart-card-apply-online-karnataka
// = <name> + "-apply-online" + (state for state schemes, if not already in name).
// Name core capped so the suffix always survives.
function descriptiveSlug(scheme) {
  let core = slugify(scheme.name);
  if (core.length > 58) {
    core = core.slice(0, 58);
    core = core.slice(0, core.lastIndexOf("-")); // don't cut mid-word
  }
  core = core.replace(/^-|-$/g, "") || "scheme";
  let slug = `${core}-apply-online`;
  if (scheme.level === "state" && scheme.state && !core.includes(scheme.state)) {
    slug += `-${scheme.state}`;
  }
  return slug;
}

function main() {
  const schemes = JSON.parse(fs.readFileSync(MS, "utf8"));
  const taken = new Set();
  const oldToNew = {};
  for (const s of schemes) {
    const oldSlug = s.slug ?? s.id;
    s.msSlug = s.msSlug || oldSlug;          // preserve myScheme code for detail lookup
    let slug = descriptiveSlug(s);
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
