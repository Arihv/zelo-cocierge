-- Ativação de hospedagem pelo próprio hóspede.
-- O hóspede informa o código do imóvel e as datas da própria reserva.
-- A reserva é criada no banco e passa a aparecer automaticamente para a administração.
CREATE OR REPLACE FUNCTION public.self_activate_reservation(
  _code TEXT,
  _check_in DATE,
  _check_out DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT := regexp_replace(upper(trim(coalesce(_code, ''))), '[^A-Z0-9]', '', 'g');
  v_apartment public.apartments;
  v_profile public.profiles;
  v_existing_id UUID;
  v_reservation_id UUID;
  v_reservation_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Faça login novamente para validar sua hospedagem.';
  END IF;

  IF v_code = '' THEN
    RAISE EXCEPTION 'Informe o código do imóvel.';
  END IF;

  IF _check_in IS NULL OR _check_out IS NULL THEN
    RAISE EXCEPTION 'Informe as datas de check-in e check-out.';
  END IF;

  IF _check_out <= _check_in THEN
    RAISE EXCEPTION 'A data de check-out deve ser posterior ao check-in.';
  END IF;

  SELECT a.*
  INTO v_apartment
  FROM public.apartments a
  WHERE regexp_replace(upper(coalesce(a.code, '')), '[^A-Z0-9]', '', 'g') = v_code
    AND coalesce(a.is_active, true) = true
  LIMIT 1;

  IF v_apartment.id IS NULL THEN
    RAISE EXCEPTION 'Código do imóvel não encontrado. Confira o código informado pela hospedagem.';
  END IF;

  SELECT p.*
  INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id;

  -- Evita duplicar a mesma hospedagem caso o hóspede toque duas vezes em validar.
  SELECT r.id
  INTO v_existing_id
  FROM public.reservations r
  WHERE r.guest_id = v_user_id
    AND r.apartment_id = v_apartment.id
    AND r.check_in = _check_in
    AND r.check_out = _check_out
    AND r.status IN ('pendente', 'confirmada', 'ativa')
  ORDER BY r.created_at DESC
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.reservations
    SET
      status = 'ativa',
      guest_name = COALESCE(NULLIF(v_profile.full_name, ''), guest_name),
      guest_phone = COALESCE(NULLIF(v_profile.phone, ''), guest_phone),
      address = concat_ws(', ', nullif(v_apartment.address, ''), nullif(v_apartment.city, ''), nullif(v_apartment.state, ''))
    WHERE id = v_existing_id;

    RETURN v_existing_id;
  END IF;

  v_reservation_code := 'WEB-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  INSERT INTO public.reservations (
    apartment_id,
    guest_id,
    reservation_code,
    guest_name,
    guest_phone,
    address,
    check_in,
    check_out,
    status
  )
  VALUES (
    v_apartment.id,
    v_user_id,
    v_reservation_code,
    NULLIF(v_profile.full_name, ''),
    NULLIF(v_profile.phone, ''),
    concat_ws(', ', nullif(v_apartment.address, ''), nullif(v_apartment.city, ''), nullif(v_apartment.state, '')),
    _check_in,
    _check_out,
    'ativa'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.self_activate_reservation(TEXT, DATE, DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.self_activate_reservation(TEXT, DATE, DATE) TO authenticated;
