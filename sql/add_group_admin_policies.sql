-- === Storage bucket for group avatars ===
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('group-avatars', 'group-avatars', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Public read access for group avatars
DROP POLICY IF EXISTS "group_avatars_public_read" ON storage.objects;
CREATE POLICY "group_avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'group-avatars');

-- Authenticated users can upload to group-avatars (app-level check prevents abuse)
DROP POLICY IF EXISTS "group_avatars_auth_upload" ON storage.objects;
CREATE POLICY "group_avatars_auth_upload" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'group-avatars');

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "group_avatars_auth_delete" ON storage.objects;
CREATE POLICY "group_avatars_auth_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'group-avatars' AND auth.uid() = owner);

-- === Security definer function: is_group_admin ===
CREATE OR REPLACE FUNCTION public.is_group_admin(group_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = group_uuid AND user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql;

-- === UPDATE policy on groups (admin can edit name, description, avatar_url) ===
DROP POLICY IF EXISTS "admin update groups" ON public.groups;
CREATE POLICY "admin update groups" ON public.groups FOR UPDATE
  USING (public.is_group_admin(id, auth.uid()))
  WITH CHECK (public.is_group_admin(id, auth.uid()));

-- === DELETE policy on groups (admin can delete) ===
DROP POLICY IF EXISTS "admin delete groups" ON public.groups;
CREATE POLICY "admin delete groups" ON public.groups FOR DELETE
  USING (public.is_group_admin(id, auth.uid()));

-- === UPDATE policy on group_members (admin can change roles) ===
DROP POLICY IF EXISTS "admin update members" ON public.group_members;
CREATE POLICY "admin update members" ON public.group_members FOR UPDATE
  USING (public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (public.is_group_admin(group_id, auth.uid()));
