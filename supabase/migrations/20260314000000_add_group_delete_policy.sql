-- Allow group owners to delete their own group
DROP POLICY IF EXISTS "Owners can delete their groups" ON public.groups;
CREATE POLICY "Owners can delete their groups"
ON public.groups
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'owner'
  )
);
