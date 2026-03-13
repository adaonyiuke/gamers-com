-- Add invited_by column to meetup_participants table
-- This tracks who invited a guest to a specific meetup
ALTER TABLE meetup_participants ADD COLUMN invited_by uuid REFERENCES group_members(id);
