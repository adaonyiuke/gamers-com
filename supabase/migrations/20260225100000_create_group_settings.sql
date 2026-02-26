-- Group settings table: one row per group with all preferences
CREATE TABLE public.group_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL UNIQUE REFERENCES public.groups(id) ON DELETE CASCADE,

  -- Group: Identity
  default_meetup_name_format text DEFAULT 'Game Night #{n}',

  -- Group: Guest policy
  guest_include_in_stats boolean DEFAULT false,
  guest_allow_recurring boolean DEFAULT true,

  -- Group: Meetup defaults
  auto_include_all_members boolean DEFAULT true,
  default_meetup_status text DEFAULT 'planned',

  -- Game: Session rules
  allow_edit_finalized boolean DEFAULT false,
  lock_sessions_after_complete boolean DEFAULT true,

  -- Game: Animations
  confetti_intensity text DEFAULT 'medium',
  winner_animation boolean DEFAULT true,
  reduced_motion boolean DEFAULT false,

  -- Dashboard: Leaderboards
  leaderboard_default_sort text DEFAULT 'wins',
  leaderboard_include_guests boolean DEFAULT false,

  -- Dashboard: Streaks
  streak_window int DEFAULT 10,
  streak_include_guests boolean DEFAULT false,

  -- Dashboard: Highlights
  show_most_improved boolean DEFAULT true,
  show_rivalry_stats boolean DEFAULT true,
  show_fun_stats boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "group_settings_select" ON public.group_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_settings.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_settings_insert" ON public.group_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_settings.group_id
      AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "group_settings_update" ON public.group_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_settings.group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'owner'
    )
  );

-- Auto-create settings row when a group is created
CREATE OR REPLACE FUNCTION public.handle_new_group_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.group_settings (group_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created_settings
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group_settings();

-- Backfill: create settings for any existing groups
INSERT INTO public.group_settings (group_id)
SELECT id FROM public.groups g
WHERE NOT EXISTS (
  SELECT 1 FROM public.group_settings gs WHERE gs.group_id = g.id
);
