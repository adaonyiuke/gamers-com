-- Track which badges each user has already been shown per group.
-- One row per (user, group, badge). The unique constraint prevents
-- duplicates and means "this badge has been shown once" is the invariant.

create table if not exists badge_notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  group_id    uuid        not null references groups(id)      on delete cascade,
  badge_id    text        not null,
  created_at  timestamptz not null default now(),

  unique(user_id, group_id, badge_id)
);

alter table badge_notifications enable row level security;

create policy "Users can read own badge notifications"
  on badge_notifications for select
  using (user_id = auth.uid());

create policy "Users can insert own badge notifications"
  on badge_notifications for insert
  with check (user_id = auth.uid());
