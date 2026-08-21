-- Administração pode criar imóveis para qualquer proprietário cadastrado.
-- Hóspedes e proprietários continuam sem poder criar imóveis de terceiros.
DROP POLICY IF EXISTS "Admins can insert apartments" ON public.apartments;
CREATE POLICY "Admins can insert apartments"
  ON public.apartments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- A administração gerencia os dados de exibição e o papel de acesso das contas.
-- Senhas continuam exclusivamente no Supabase Auth e nunca são expostas aqui.
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all roles" ON public.user_roles;
CREATE POLICY "Admins can update all roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
