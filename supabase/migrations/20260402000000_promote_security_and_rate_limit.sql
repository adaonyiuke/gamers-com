-- GAM-42: Add promote_email to guests so the RPC can verify the right person claims the history
-- GAM-40: Add promote_email_sent_at for rate-limiting promote emails

ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS promote_email text,
  ADD COLUMN IF NOT EXISTS promote_email_sent_at timestamptz;

-- Replace the join_group_by_invite_code RPC to verify promote_email matches
CREATE OR REPLACE FUNCTION public.join_group_by_invite_code(
  invite_code text,
  p_display_name text DEFAULT 'Member',
  p_promote_guest_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_group_id uuid;
  v_group_name text;
  v_member_id uuid;
  v_existing_member_id uuid;
  v_guest record;
BEGIN
  -- Get the authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Not authenticated');
  END IF;

  -- Get authenticated user's email for promote verification
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = v_user_id;

  -- Look up the group
  SELECT g.id, g.name INTO v_group_id, v_group_name
  FROM public.groups g
  WHERE UPPER(g.invite_code) = UPPER(join_group_by_invite_code.invite_code);

  IF v_group_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Invalid or expired invite code');
  END IF;

  -- If promoting, fetch and validate the guest record up front
  IF p_promote_guest_id IS NOT NULL THEN
    SELECT g.id, g.name, g.promoted_to_user_id, g.promote_email
    INTO v_guest
    FROM public.guests g
    WHERE g.id = p_promote_guest_id AND g.group_id = v_group_id;

    -- Verify the authenticated user's email matches the intended recipient
    IF v_guest IS NOT NULL
       AND v_guest.promote_email IS NOT NULL
       AND LOWER(v_guest.promote_email) != LOWER(v_user_email) THEN
      RETURN jsonb_build_object('error', 'This promotion link was sent to a different email address. Please sign in with the correct account.');
    END IF;
  END IF;

  -- Check if already a member
  SELECT gm.id INTO v_existing_member_id
  FROM public.group_members gm
  WHERE gm.group_id = v_group_id AND gm.user_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    -- Already a member — handle guest promotion if needed
    IF p_promote_guest_id IS NOT NULL THEN
      IF v_guest IS NOT NULL AND v_guest.promoted_to_user_id IS NULL THEN
        -- Reassign meetup_participants from guest to existing member
        UPDATE public.meetup_participants
        SET member_id = v_existing_member_id, guest_id = NULL
        WHERE guest_id = p_promote_guest_id;

        -- Reassign score_entries from guest to existing member
        UPDATE public.score_entries
        SET participant_id = v_existing_member_id
        WHERE participant_id IN (
          SELECT mp.id FROM public.meetup_participants mp
          WHERE mp.guest_id = p_promote_guest_id
        );

        -- Mark guest as promoted
        UPDATE public.guests
        SET promoted_to_user_id = v_user_id
        WHERE id = p_promote_guest_id;
      END IF;
    END IF;

    RETURN jsonb_build_object(
      'member_id', v_existing_member_id,
      'group_id', v_group_id,
      'group_name', v_group_name,
      'already_member', true
    );
  END IF;

  -- If promoting a guest, use guest name if display_name is default
  IF p_promote_guest_id IS NOT NULL
     AND v_guest IS NOT NULL
     AND v_guest.promoted_to_user_id IS NULL
     AND p_display_name = 'Member' THEN
    p_display_name := v_guest.name;
  END IF;

  -- Insert new membership
  INSERT INTO public.group_members (group_id, user_id, role, display_name)
  VALUES (v_group_id, v_user_id, 'member', p_display_name)
  RETURNING id INTO v_member_id;

  -- Handle guest promotion migration
  IF p_promote_guest_id IS NOT NULL AND v_guest IS NOT NULL AND v_guest.promoted_to_user_id IS NULL THEN
    -- Reassign meetup_participants from guest to new member
    UPDATE public.meetup_participants
    SET member_id = v_member_id, guest_id = NULL
    WHERE guest_id = p_promote_guest_id;

    -- Mark guest as promoted
    UPDATE public.guests
    SET promoted_to_user_id = v_user_id
    WHERE id = p_promote_guest_id;
  END IF;

  RETURN jsonb_build_object(
    'member_id', v_member_id,
    'group_id', v_group_id,
    'group_name', v_group_name,
    'already_member', false
  );
END;
$function$;
