-- Diagnóstico determinístico para vinculação de hospedagem.
CREATE OR REPLACE FUNCTION public.reservation_link_status(_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := regexp_replace(upper(trim(coalesce(_code, ''))), '[^A-Z0-9]', '', 'g');
  v_apartment_id UUID;
  v_reservation_id UUID;
  v_any_reservation BOOLEAN := FALSE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('state','unauthenticated','message','Faça login novamente para vincular a hospedagem.');
  END IF;
  IF v_code = '' THEN
    RETURN jsonb_build_object('state','not_found','message','Informe o código do imóvel ou da reserva.');
  END IF;

  SELECT a.id INTO v_apartment_id
  FROM public.apartments a
  WHERE regexp_replace(upper(coalesce(a.code,'')), '[^A-Z0-9]', '', 'g') = v_code
  LIMIT 1;

  SELECT r.id INTO v_reservation_id
  FROM public.reservations r
  LEFT JOIN public.apartments a ON a.id = r.apartment_id
  WHERE (
    regexp_replace(upper(coalesce(r.reservation_code,'')), '[^A-Z0-9]', '', 'g') = v_code
    OR regexp_replace(upper(coalesce(a.code,'')), '[^A-Z0-9]', '', 'g') = v_code
  )
  AND r.status IN ('pendente','confirmada','ativa')
  AND (r.guest_id IS NULL OR r.guest_id = auth.uid())
  ORDER BY r.check_in DESC
  LIMIT 1;

  IF v_reservation_id IS NOT NULL THEN
    RETURN jsonb_build_object('state','available','reservation_id',v_reservation_id,'message','Reserva disponível para vinculação.');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.reservations r
    LEFT JOIN public.apartments a ON a.id = r.apartment_id
    WHERE regexp_replace(upper(coalesce(r.reservation_code,'')), '[^A-Z0-9]', '', 'g') = v_code
       OR regexp_replace(upper(coalesce(a.code,'')), '[^A-Z0-9]', '', 'g') = v_code
  ) INTO v_any_reservation;

  IF v_apartment_id IS NOT NULL AND NOT v_any_reservation THEN
    RETURN jsonb_build_object('state','apartment_without_reservation','message','O imóvel foi encontrado, mas ainda não existe uma reserva cadastrada para ele. No painel administrativo, crie a reserva com check-in e check-out.');
  END IF;

  IF v_any_reservation THEN
    RETURN jsonb_build_object('state','reservation_unavailable','message','Existe uma reserva para este código, mas ela não está disponível para esta conta. Verifique o status ou se já foi vinculada a outro hóspede.');
  END IF;

  RETURN jsonb_build_object('state','not_found','message','Código de imóvel ou reserva não encontrado no banco.');
END;
$$;

REVOKE ALL ON FUNCTION public.reservation_link_status(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reservation_link_status(TEXT) TO authenticated;
