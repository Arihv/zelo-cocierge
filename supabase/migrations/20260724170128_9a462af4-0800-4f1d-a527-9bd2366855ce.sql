
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

-- apartments
DROP POLICY IF EXISTS "Admins can delete any apartment" ON public.apartments;
DROP POLICY IF EXISTS "Admins can update any apartment" ON public.apartments;
DROP POLICY IF EXISTS "Admins can view all apartments" ON public.apartments;
DROP POLICY IF EXISTS "Hosts can insert own apartments" ON public.apartments;

CREATE POLICY "Admins can delete any apartment" ON public.apartments
  FOR DELETE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can update any apartment" ON public.apartments
  FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can view all apartments" ON public.apartments
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Hosts can insert own apartments" ON public.apartments
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = host_id) AND (private.has_role(auth.uid(), 'host'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role)));

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- storage.objects policies for apartment-photos
DROP POLICY IF EXISTS "Apartment photos scoped access" ON storage.objects;
DROP POLICY IF EXISTS "Hosts and admins can upload apartment photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can update apartment photos" ON storage.objects;
DROP POLICY IF EXISTS "Owners and admins can delete apartment photos" ON storage.objects;
DROP POLICY IF EXISTS "View apartment photos with ownership check" ON storage.objects;

CREATE POLICY "Apartment photos scoped access" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'apartment-photos'
    AND (
      owner = auth.uid()
      OR private.has_role(auth.uid(), 'admin'::public.app_role)
      OR EXISTS (
        SELECT 1 FROM public.apartments a
        WHERE a.cover_url = storage.objects.name
          AND (a.host_id = auth.uid() OR a.is_active = true)
      )
    )
  );

CREATE POLICY "Hosts and admins can upload apartment photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'apartment-photos'
    AND (private.has_role(auth.uid(), 'host'::public.app_role) OR private.has_role(auth.uid(), 'admin'::public.app_role))
  );

CREATE POLICY "Owners and admins can update apartment photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'apartment-photos'
    AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
  );

CREATE POLICY "Owners and admins can delete apartment photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'apartment-photos'
    AND (owner = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- Remove public.has_role from the exposed API schema
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
