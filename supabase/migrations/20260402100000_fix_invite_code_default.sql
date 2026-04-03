-- Drop the column default (substr(md5(random()::text), 1, 8)) which was
-- generating 8-char hex codes, overriding the BEFORE INSERT trigger that
-- calls generate_invite_code() (6-char uppercase alphanumeric).
ALTER TABLE public.groups ALTER COLUMN invite_code DROP DEFAULT;

-- Backfill any existing 8-char hex codes with proper 6-char codes
UPDATE public.groups
SET invite_code = public.generate_invite_code()
WHERE length(invite_code) != 6;
