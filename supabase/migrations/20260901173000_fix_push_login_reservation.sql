-- Correções pós-teste de 01/09/2026.

-- Registra/reassocia uma assinatura de push ao administrador autenticado.
-- SECURITY DEFINER é usado para que um endpoint antigo do mesmo navegador possa
-- ser transferido sem expor as assinaturas de outros usuários via RLS.
CREATE OR REPLACE FUNCTION public.register_admin_push_subscription(
  _endpoint TEXT,
  _p256dh TEXT,
  _auth TEXT,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessão administrativa não encontrada.';
  END IF;

  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Somente administradores podem ativar notificações push.';
  END IF;

  IF COALESCE(trim(_endpoint), '') = '' OR COALESCE(trim(_p256dh), '') = '' OR COALESCE(trim(_auth), '') = '' THEN
    RAISE EXCEPTION 'Assinatura de push incompleta.';
  END IF;

  INSERT INTO public.push_subscriptions (
    user_id, endpoint, p256dh, auth, user_agent, last_seen_at
  )
  VALUES (
    auth.uid(), _endpoint, _p256dh, _auth, _user_agent, now()
  )
  ON CONFLICT (endpoint) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent,
    last_seen_at = now()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_admin_push_subscription(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_admin_push_subscription(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Diferencia imóvel inexistente de imóvel existente sem reserva disponível.
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
  v_apartment_exists BOOLEAN := FALSE;
  v_reservation_code_exists BOOLEAN := FALSE;
BEGIN
  IF v_code = '' THEN
    RAISE EXCEPTION 'Informe o código do imóvel ou da reserva enviado pela administração.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.apartments a
    WHERE regexp_replace(upper(coalesce(a.code, '')), '[^A-Z0-9]', '', 'g') = v_code
  ) INTO v_apartment_exists;

  SELECT EXISTS (
    SELECT 1
    FROM public.reservations r
    WHERE regexp_replace(upper(coalesce(r.reservation_code, '')), '[^A-Z0-9]', '', 'g') = v_code
  ) INTO v_reservation_code_exists;

  SELECT r.*
  INTO v_res
  FROM public.reservations r
  JOIN public.apartments a ON a.id = r.apartment_id
  WHERE (
      regexp_replace(upper(coalesce(r.reservation_code, '')), '[^A-Z0-9]', '', 'g') = v_code
      OR regexp_replace(upper(coalesce(a.code, '')), '[^A-Z0-9]', '', 'g') = v_code
    )
    AND r.status IN ('pendente', 'confirmada', 'ativa')
    AND (r.guest_id IS NULL OR r.guest_id = auth.uid())
  ORDER BY r.check_in DESC
  LIMIT 1;

  IF v_res.id IS NULL THEN
    IF v_apartment_exists THEN
      RAISE EXCEPTION 'O imóvel foi encontrado, mas não existe uma reserva disponível para ele. A administração precisa cadastrar a reserva com check-in e check-out.';
    ELSIF v_reservation_code_exists THEN
      RAISE EXCEPTION 'A reserva existe, mas não está disponível para vinculação. Verifique o status ou se ela já está vinculada a outra conta.';
    ELSE
      RAISE EXCEPTION 'Código de imóvel ou reserva não encontrado.';
    END IF;
  END IF;

  SELECT full_name INTO v_guest_name
  FROM public.profiles
  WHERE id = auth.uid();

  UPDATE public.reservations
  SET
    guest_id = auth.uid(),
    guest_name = COALESCE(NULLIF(v_guest_name, ''), guest_name),
    status = 'ativa'
  WHERE id = v_res.id;

  RETURN QUERY SELECT v_res.id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_reservation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_reservation(TEXT) TO authenticated;
