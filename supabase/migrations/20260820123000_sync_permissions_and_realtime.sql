-- Administration owns all configuration. Hosts and guests only consume shared data.
DROP POLICY IF EXISTS "Hosts can insert own apartments" ON public.apartments;
DROP POLICY IF EXISTS "Hosts can update own apartments" ON public.apartments;
DROP POLICY IF EXISTS "Hosts can delete own apartments" ON public.apartments;

DROP POLICY IF EXISTS "Hosts and admins create reservations" ON public.reservations;
DROP POLICY IF EXISTS "Hosts and admins update reservations" ON public.reservations;
CREATE POLICY "Admins create reservations" ON public.reservations
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update reservations" ON public.reservations
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- The order is linked to the guest's reservation/apartment in the client; RLS keeps hosts read-only.
DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Guests create own reservation orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id AND r.apartment_id = apartment_id
        AND r.guest_id = auth.uid() AND r.status IN ('confirmada', 'ativa')
    )
  );

-- Profiles and roles created by handle_new_user are visible to administrators for people management.
CREATE POLICY "Admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins update roles" ON public.user_roles;
CREATE POLICY "Admins update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles (lower(email)) WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE requested_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), COALESCE(NEW.raw_user_meta_data ->> 'phone', ''), NEW.email);
  BEGIN
    requested_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::public.app_role, 'guest'::public.app_role);
  EXCEPTION WHEN OTHERS THEN requested_role := 'guest'::public.app_role;
  END;
  IF requested_role = 'admin' THEN requested_role := 'guest'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, requested_role);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'orders') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reservations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
