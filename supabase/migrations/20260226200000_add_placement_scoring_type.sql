-- Extend games.scoring_type to accept 'placement' in addition to the existing values.
--
-- The original CHECK constraint on scoring_type was created outside of tracked migrations
-- (directly in Supabase), so its name is unknown. This DO block finds and drops any
-- existing CHECK constraint that references scoring_type, then re-adds it with the full
-- set of valid values including 'placement'.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'games'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%scoring_type%'
  LOOP
    EXECUTE format('ALTER TABLE games DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE games
  ADD CONSTRAINT games_scoring_type_check
  CHECK (scoring_type IN ('highest_wins', 'lowest_wins', 'manual_winner', 'placement'));
