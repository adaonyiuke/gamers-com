-- Remove unused min_players/max_players columns from games table
ALTER TABLE public.games DROP COLUMN IF EXISTS min_players;
ALTER TABLE public.games DROP COLUMN IF EXISTS max_players;
