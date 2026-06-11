-- IFSC branches — D1 schema (Cloudflare migration, replaces fs reads of data/ifsc/*.json)
-- 134,791 branches across 19 banks. Indexed for every query src/lib/ifsc.ts serves.

DROP TABLE IF EXISTS ifsc_branches;

CREATE TABLE ifsc_branches (
  ifsc          TEXT PRIMARY KEY,
  bank          TEXT NOT NULL,
  bank_slug     TEXT NOT NULL,
  branch        TEXT NOT NULL,
  branch_display TEXT NOT NULL,
  city          TEXT NOT NULL,
  city_slug     TEXT NOT NULL,
  district      TEXT NOT NULL,
  state         TEXT NOT NULL,
  state_slug    TEXT NOT NULL,
  address       TEXT NOT NULL,
  micr          TEXT NOT NULL,
  contact       TEXT NOT NULL,
  neft          INTEGER NOT NULL,
  rtgs          INTEGER NOT NULL,
  imps          INTEGER NOT NULL,
  upi           INTEGER NOT NULL,
  page_slug     TEXT NOT NULL
);

-- getBranchBySlug(bankSlug, pageSlug) — the hot path (every branch page render).
-- NOT unique: ~62% of branches share a (bank_slug, page_slug) with a different
-- IFSC (a pre-existing slug-collision quirk; the live site's .find() returns the
-- first such branch). The PRIMARY KEY (ifsc) keeps all 134,791 rows; lookups use
-- LIMIT 1 to mirror current behaviour.
CREATE INDEX idx_ifsc_bank_page ON ifsc_branches (bank_slug, page_slug);
-- getBranchesByBank / getCitiesByBank / getBranchesByCity / getNearbyBranches
CREATE INDEX idx_ifsc_bank_city ON ifsc_branches (bank_slug, city_slug);

-- Per-bank summary (replaces banks.json): getAllBanks / getAllBankSlugs
DROP TABLE IF EXISTS ifsc_banks;
CREATE TABLE ifsc_banks (
  slug  TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  count INTEGER NOT NULL
);
