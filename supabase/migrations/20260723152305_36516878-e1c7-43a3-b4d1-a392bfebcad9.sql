
-- Tighten storage SELECT policy
DROP POLICY IF EXISTS "Authenticated can view apartment photos" ON storage.objects;

CREATE POLICY "View apartment photos with ownership check"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'apartment-photos'
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.apartments a
      WHERE a.cover_url = storage.objects.name
        AND (a.host_id = auth.uid() OR a.is_active = true)
    )
  )
);

-- Revoke direct EXECUTE on SECURITY DEFINER functions from anon/authenticated/public.
-- Trigger functions run under the trigger owner, so revocation does not break them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- has_role is referenced by RLS policies; anon never needs it, but authenticated
-- must keep EXECUTE for RLS evaluation on user-scoped tables.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
