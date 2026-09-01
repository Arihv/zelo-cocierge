-- Ajustes solicitados em 01/09/2026.

-- Evita notificações triplicadas: os gatilhos consolidados mais novos já cuidam de INSERT/UPDATE.
DROP TRIGGER IF EXISTS trg_notify_order_created ON public.orders;
DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;

-- CPF no perfil criado pelo cadastro.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, cpf)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone', NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data ->> 'cpf',''), '\D', '', 'g'), ''))
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, public.profiles.cpf);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN NEW.raw_user_meta_data ->> 'role' = 'host' THEN 'host'::public.app_role ELSE 'guest'::public.app_role END)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Opções por produto e categorias editáveis.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS options TEXT;
CREATE TABLE IF NOT EXISTS public.market_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.market_categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.market_categories TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.market_categories TO authenticated;
GRANT ALL ON public.market_categories TO service_role;
DROP POLICY IF EXISTS "Authenticated view market categories" ON public.market_categories;
DROP POLICY IF EXISTS "Admins manage market categories" ON public.market_categories;
CREATE POLICY "Authenticated view market categories" ON public.market_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage market categories" ON public.market_categories FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
INSERT INTO public.market_categories (name, sort_order) VALUES
 ('Bebidas',10),('Laticínios',20),('Frios e Ovos',30),('Grãos e Massas',40),('Mercearia',50),('Snacks e Doces',60),('Padaria e Matinais',70),('Higiene e Limpeza',80)
ON CONFLICT (name) DO NOTHING;

-- Ao hóspede ativar uma hospedagem, vincula a conta, salva o nome e marca a reserva como ativa.
CREATE OR REPLACE FUNCTION public.link_reservation(_code TEXT)
RETURNS TABLE (reservation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := regexp_replace(upper(trim(coalesce(_code, ''))), '[^A-Z0-9]', '', 'g');
  v_res public.reservations;
  v_guest_name TEXT;
BEGIN
  IF v_code = '' THEN
    RAISE EXCEPTION 'Informe o código do imóvel ou da reserva enviado pela administração.';
  END IF;

  SELECT r.* INTO v_res
  FROM public.reservations r
  JOIN public.apartments a ON a.id = r.apartment_id
  WHERE (
      regexp_replace(upper(r.reservation_code), '[^A-Z0-9]', '', 'g') = v_code
      OR regexp_replace(upper(coalesce(a.code, '')), '[^A-Z0-9]', '', 'g') = v_code
    )
    AND r.status IN ('pendente', 'confirmada', 'ativa')
    AND (r.guest_id IS NULL OR r.guest_id = auth.uid())
  ORDER BY r.check_in DESC
  LIMIT 1;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Código inválido, expirado ou já vinculado a outra conta.';
  END IF;

  SELECT full_name INTO v_guest_name FROM public.profiles WHERE id = auth.uid();

  UPDATE public.reservations
  SET guest_id = auth.uid(),
      guest_name = COALESCE(NULLIF(v_guest_name, ''), guest_name),
      status = 'ativa'
  WHERE id = v_res.id;

  RETURN QUERY SELECT v_res.id;
END;
$$;
REVOKE ALL ON FUNCTION public.link_reservation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_reservation(TEXT) TO authenticated;
