-- Add abbreviation column to games table
ALTER TABLE games ADD COLUMN abbreviation TEXT;

-- Backfill existing games: use first 2 chars of name, uppercased
UPDATE games SET abbreviation = UPPER(LEFT(name, 2)) WHERE abbreviation IS NULL;

-- Make it NOT NULL after backfill
ALTER TABLE games ALTER COLUMN abbreviation SET NOT NULL;

-- Add constraint: max 2 characters
ALTER TABLE games ADD CONSTRAINT games_abbreviation_max_length CHECK (char_length(abbreviation) <= 2);
