-- Pincode post offices — D1 schema (Cloudflare migration, replaces fs reads of
-- data/pincode/*.json for the on-demand leaf route). ~19,238 post offices.

DROP TABLE IF EXISTS pincode_places;

CREATE TABLE pincode_places (
  -- a pincode can have many post offices, so the natural key is (pincode, post_office)
  pincode       TEXT NOT NULL,
  post_office   TEXT NOT NULL,
  places        TEXT NOT NULL,   -- JSON array
  district      TEXT NOT NULL,
  district_slug TEXT NOT NULL,
  state         TEXT NOT NULL,
  state_slug    TEXT NOT NULL,
  taluk         TEXT NOT NULL,
  lat           TEXT NOT NULL,
  lng           TEXT NOT NULL,
  page_slug     TEXT NOT NULL    -- slugify(postOffice)-pincode
);

-- getPincodeBySlug(state, district, slug): match on state+district+pincode
CREATE INDEX idx_pin_state_district_pin ON pincode_places (state_slug, district_slug, pincode);
-- getPincodeData(pincode) + page lookup by slug
CREATE INDEX idx_pin_pincode ON pincode_places (pincode);
CREATE INDEX idx_pin_state_page ON pincode_places (state_slug, district_slug, page_slug);
