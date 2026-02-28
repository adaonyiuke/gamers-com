-- Add soft delete support to meetups
ALTER TABLE meetups ADD COLUMN deleted_at TIMESTAMPTZ;

-- Index for efficient filtering of non-deleted meetups
CREATE INDEX idx_meetups_deleted_at ON meetups (deleted_at) WHERE deleted_at IS NULL;
