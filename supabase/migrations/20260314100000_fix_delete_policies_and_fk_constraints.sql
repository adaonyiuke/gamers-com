-- ── 1. Fix FK constraints that block member/participant deletion ──────────────
-- sessions.winner_participant_id: NO ACTION → SET NULL
--   (when a meetup_participant is deleted, null out any sessions they won)
ALTER TABLE public.sessions
  DROP CONSTRAINT IF EXISTS sessions_winner_participant_id_fkey,
  ADD CONSTRAINT sessions_winner_participant_id_fkey
    FOREIGN KEY (winner_participant_id)
    REFERENCES public.meetup_participants(id)
    ON DELETE SET NULL;

-- meetup_participants.invited_by: NO ACTION → SET NULL
ALTER TABLE public.meetup_participants
  DROP CONSTRAINT IF EXISTS meetup_participants_invited_by_fkey,
  ADD CONSTRAINT meetup_participants_invited_by_fkey
    FOREIGN KEY (invited_by)
    REFERENCES public.group_members(id)
    ON DELETE SET NULL;

-- guests.invited_by: NO ACTION → SET NULL
ALTER TABLE public.guests
  DROP CONSTRAINT IF EXISTS guests_invited_by_fkey,
  ADD CONSTRAINT guests_invited_by_fkey
    FOREIGN KEY (invited_by)
    REFERENCES public.group_members(id)
    ON DELETE SET NULL;

-- ── 2. DELETE RLS policies ────────────────────────────────────────────────────

-- meetups: admins can hard-delete meetups in their group
CREATE POLICY "Admins can delete meetups"
ON public.meetups
FOR DELETE
USING (private.is_group_admin(meetups.group_id));

-- sessions: admins can delete sessions (cascades to score_entries via FK)
CREATE POLICY "Admins can delete sessions"
ON public.sessions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.meetups m
    WHERE m.id = sessions.meetup_id
      AND private.is_group_admin(m.group_id)
  )
);

-- score_entries: admins can delete score entries for their group's sessions
CREATE POLICY "Admins can delete score entries"
ON public.score_entries
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.meetups m ON m.id = s.meetup_id
    WHERE s.id = score_entries.session_id
      AND private.is_group_admin(m.group_id)
  )
);

-- games: admins can delete games in their group
CREATE POLICY "Admins can delete games"
ON public.games
FOR DELETE
USING (private.is_group_admin(games.group_id));

-- guests: admins can delete guests in their group
CREATE POLICY "Admins can delete guests"
ON public.guests
FOR DELETE
USING (private.is_group_admin(guests.group_id));
