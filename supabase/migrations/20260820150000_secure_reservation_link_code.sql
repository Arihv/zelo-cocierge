-- A hospedagem só pode ser vinculada por um código de reserva enviado pela administração.
-- O código interno do imóvel (S/D/T) nunca deve servir como senha de acesso.
CREATE OR REPLACE FUNCTION public.link_reservation(_code TEXT)
RETURNS TABLE (reservation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := upper(trim(coalesce(_code, '')));
  v_res public.reservations;
BEGIN
  IF v_code = '' THEN
    RAISE EXCEPTION 'Informe o código de reserva enviado pela administração.';
  END IF;

  SELECT r.* INTO v_res
  FROM public.reservations r
  WHERE upper(r.reservation_code) = v_code
    AND r.status IN ('pendente','confirmada','ativa')
    AND (r.guest_id IS NULL OR r.guest_id = auth.uid())
  ORDER BY r.check_in DESC
  LIMIT 1;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Código inválido, expirado ou já vinculado a outra conta.';
  END IF;

  UPDATE public.reservations SET guest_id = auth.uid() WHERE id = v_res.id;
  RETURN QUERY SELECT v_res.id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_reservation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_reservation(TEXT) TO authenticated;
