-- BGG catalog: reference table imported from BGG's full game database CSV.
-- Used for local name-matching (faster/more reliable than XML search API)
-- and for displaying ranks/ratings.

CREATE TABLE bgg_catalog (
  bgg_id integer PRIMARY KEY,
  name text NOT NULL,
  year_published integer,
  rank integer,
  bayes_average numeric(7, 5),
  average numeric(7, 5),
  users_rated integer,
  is_expansion boolean NOT NULL DEFAULT false,
  abstracts_rank integer,
  cgs_rank integer,
  childrensgames_rank integer,
  familygames_rank integer,
  partygames_rank integer,
  strategygames_rank integer,
  thematic_rank integer,
  wargames_rank integer,
  imported_at timestamptz NOT NULL DEFAULT now()
);

-- Index for name lookups during matching
CREATE INDEX idx_bgg_catalog_name_lower ON bgg_catalog (lower(name));

-- Index for rank-based queries
CREATE INDEX idx_bgg_catalog_rank ON bgg_catalog (rank) WHERE rank IS NOT NULL;
