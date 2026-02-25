-- Fix groups SELECT policy: allow both the creator AND group members to read
drop policy if exists "groups_select_own" on public.groups;
drop policy if exists "groups_select" on public.groups;

create policy "groups_select_owner_or_member"
on public.groups
for select
using (
  created_by = auth.uid()
  OR exists (
    select 1 from public.group_members gm
    where gm.group_id = groups.id
      and gm.user_id = auth.uid()
  )
);
