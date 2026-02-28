-- Add 'pending_auth' to the image_status CHECK constraint.
-- This status means "we want BGG art but the API token is not configured yet."

-- Drop the old constraint and recreate with the new value
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_image_status_check;
ALTER TABLE games ADD CONSTRAINT games_image_status_check
  CHECK (image_status IN ('pending', 'ok', 'missing', 'ambiguous', 'error', 'pending_auth'));
