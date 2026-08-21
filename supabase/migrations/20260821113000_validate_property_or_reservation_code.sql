-- Cada código informado nos cards deve corresponder exatamente a uma reserva
-- ativa/confirmada ou ao código real do imóvel vinculado a ela. Traços e espaços
-- são ignorados apenas para facilitar a digitação (S-102 e S102 equivalem).
CREATE OR REPLACE FUNCTION public.link_reservation(_code TEXT)
RETURNS TABLE (reservation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := regexp_replace(upper(trim(coalesce(_code, ''))), '[^A-Z0-9]', '', 'g');
  v_res public.reservations;
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

  UPDATE public.reservations
  SET guest_id = auth.uid()
  WHERE id = v_res.id;

  RETURN QUERY SELECT v_res.id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_reservation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_reservation(TEXT) TO authenticated;
