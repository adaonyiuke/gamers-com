-- Enforce session locking: prevent modifications to finalized session results
-- unless allow_edit_finalized is enabled in group_settings.
--
-- Metadata (meetup title, date) remains editable regardless.

-- 1. Block score_entries updates on finalized sessions (unless allow_edit_finalized)
CREATE OR REPLACE FUNCTION private.can_modify_session_results(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_group_id uuid;
  v_allow_edit boolean;
BEGIN
  -- Get session status and group
  SELECT s.status, m.group_id
  INTO v_status, v_group_id
  FROM public.sessions s
  JOIN public.meetups m ON m.id = s.meetup_id
  WHERE s.id = p_session_id;

  -- Not finalized = always allow
  IF v_status IS NULL OR v_status <> 'finalized' THEN
    RETURN true;
  END IF;

  -- Finalized: check group setting
  SELECT COALESCE(gs.allow_edit_finalized, false)
  INTO v_allow_edit
  FROM public.group_settings gs
  WHERE gs.group_id = v_group_id;

  RETURN COALESCE(v_allow_edit, false);
END;
$$;

-- 2. Trigger on score_entries: block INSERT/UPDATE if session is locked
CREATE OR REPLACE FUNCTION private.check_score_entry_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT private.can_modify_session_results(NEW.session_id) THEN
    RAISE EXCEPTION 'Session is finalized and locked. Enable "Allow editing finalized sessions" in group settings to modify results.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_score_entry_lock ON public.score_entries;
CREATE TRIGGER enforce_score_entry_lock
  BEFORE INSERT OR UPDATE ON public.score_entries
  FOR EACH ROW
  EXECUTE FUNCTION private.check_score_entry_lock();

-- 3. Trigger on sessions: block re-finalization (updating winner/status on already-finalized)
CREATE OR REPLACE FUNCTION private.check_session_result_lock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_group_id uuid;
  v_allow_edit boolean;
BEGIN
  -- Only apply when session is already finalized
  IF OLD.status <> 'finalized' THEN
    RETURN NEW;
  END IF;

  -- Allow if only non-result fields changed (e.g. played_at)
  IF NEW.status = OLD.status
     AND NEW.winner_participant_id IS NOT DISTINCT FROM OLD.winner_participant_id
  THEN
    RETURN NEW;
  END IF;

  -- Result fields are changing on a finalized session — check setting
  SELECT m.group_id INTO v_group_id
  FROM public.meetups m
  WHERE m.id = OLD.meetup_id;

  SELECT COALESCE(gs.allow_edit_finalized, false)
  INTO v_allow_edit
  FROM public.group_settings gs
  WHERE gs.group_id = v_group_id;

  IF NOT COALESCE(v_allow_edit, false) THEN
    RAISE EXCEPTION 'Session is finalized and locked. Enable "Allow editing finalized sessions" in group settings to modify results.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_session_result_lock ON public.sessions;
CREATE TRIGGER enforce_session_result_lock
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION private.check_session_result_lock();
