-- Add placement column to score_entries for placement-based scoring (e.g., Uno 1st/2nd/3rd)
ALTER TABLE score_entries ADD COLUMN placement INTEGER;
ALTER TABLE score_entries ADD CONSTRAINT score_entries_placement_positive CHECK (placement IS NULL OR placement > 0);
