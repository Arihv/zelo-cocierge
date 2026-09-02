-- Corrige o perfil criado no signup e preserva o e-mail para a administração.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, cpf, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''), '\D', '', 'g'), ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    phone = COALESCE(NULLIF(EXCLUDED.phone, ''), public.profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf),
    email = COALESCE(EXCLUDED.email, public.profiles.email);

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.raw_user_meta_data ->> 'role' = 'host' THEN 'host'::public.app_role
        ELSE 'guest'::public.app_role
      END
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Preenche e-mails que ficaram ausentes no perfil devido à versão anterior do trigger.
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE p.id = u.id
  AND (p.email IS NULL OR trim(p.email) = '');
