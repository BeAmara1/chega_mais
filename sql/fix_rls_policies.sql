-- Drop all existing policies on the three tables
DROP POLICY IF EXISTS "see own groups" ON public.groups;
DROP POLICY IF EXISTS "create groups" ON public.groups;
DROP POLICY IF EXISTS "see members" ON public.group_members;
DROP POLICY IF EXISTS "join event groups" ON public.group_members;
DROP POLICY IF EXISTS "admin remove members" ON public.group_members;
DROP POLICY IF EXISTS "members leave" ON public.group_members;
DROP POLICY IF EXISTS "see messages" ON public.group_messages;
DROP POLICY IF EXISTS "send messages" ON public.group_messages;
DROP POLICY IF EXISTS "update read_by" ON public.group_messages;

-- Security definer function to check group membership (bypasses RLS recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- groups policies
CREATE POLICY "see own groups" ON public.groups FOR SELECT
  USING (
    created_by = auth.uid() OR
    public.is_group_member(id, auth.uid())
  );

CREATE POLICY "create groups" ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- group_members policies
CREATE POLICY "see members" ON public.group_members FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "join event groups" ON public.group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.is_group_member(group_id, auth.uid()) OR
      group_id IN (SELECT id FROM public.groups WHERE type = 'event') OR
      auth.uid() = (SELECT created_by FROM public.groups WHERE id = group_id)
    )
  );

CREATE POLICY "admin members" ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id OR -- members can remove themselves (leave)
    (
      auth.uid() IN (
        SELECT user_id FROM public.group_members
        WHERE group_id = group_members.group_id AND role = 'admin'
      )
      AND user_id != auth.uid()
    )
  );

-- group_messages policies
CREATE POLICY "see messages" ON public.group_messages FOR SELECT
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "send messages" ON public.group_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "update messages" ON public.group_messages FOR UPDATE
  USING (public.is_group_member(group_id, auth.uid()));
