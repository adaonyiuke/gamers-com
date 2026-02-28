-- Add BoardGameGeek image fields to games table
ALTER TABLE games
  ADD COLUMN bgg_id integer,
  ADD COLUMN image_url text,
  ADD COLUMN thumbnail_url text,
  ADD COLUMN image_source text,
  ADD COLUMN image_status text DEFAULT 'pending'
    CHECK (image_status IN ('pending', 'ok', 'missing', 'ambiguous', 'error')),
  ADD COLUMN image_updated_at timestamptz;

-- Index for BGG ID lookups
CREATE INDEX idx_games_bgg_id ON games (bgg_id) WHERE bgg_id IS NOT NULL;
