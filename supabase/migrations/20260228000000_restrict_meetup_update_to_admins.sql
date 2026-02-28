-- Restrict meetup updates to admins/owners only.
-- Previously any group member could update meetups.
-- We drop the old permissive policy and create a new one using is_group_admin.

DROP POLICY IF EXISTS "Members can update meetups" ON meetups;

CREATE POLICY "Admins can update meetups"
  ON meetups
  FOR UPDATE
  USING ( (SELECT private.is_group_admin(meetups.group_id)) );
