-- 1. Function to generate a random 6-char uppercase alphanumeric code
-- Excludes ambiguous characters (0, O, 1, I) for readability
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.groups WHERE invite_code = result);
  END LOOP;
  RETURN result;
END;
$$;

-- 2. Trigger to auto-set invite_code on group creation
CREATE OR REPLACE FUNCTION public.handle_new_group_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := public.generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created_invite_code
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group_invite_code();

-- 3. Backfill existing groups that have no invite code
UPDATE public.groups
SET invite_code = public.generate_invite_code()
WHERE invite_code IS NULL;

-- 4. SECURITY DEFINER RPC to look up a group by invite code (bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_group_by_invite_code(code text)
RETURNS TABLE(id uuid, name text, description text, avatar_url text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.avatar_url
  FROM public.groups g
  WHERE g.invite_code = upper(trim(code))
  LIMIT 1;
END;
$$;
