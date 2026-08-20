-- Vincular reserva por código do imóvel ou da reserva
CREATE OR REPLACE FUNCTION public.link_reservation(_code TEXT)
RETURNS TABLE (reservation_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT := upper(trim(coalesce(_code, '')));
  v_res  public.reservations;
BEGIN
  IF v_code = '' THEN
    RAISE EXCEPTION 'Informe um código válido.';
  END IF;

  SELECT r.* INTO v_res
  FROM public.reservations r
  JOIN public.apartments a ON a.id = r.apartment_id
  WHERE (upper(r.reservation_code) = v_code OR upper(coalesce(a.code, '')) = v_code)
    AND r.status IN ('pendente','confirmada','ativa')
    AND (r.guest_id IS NULL OR r.guest_id = auth.uid())
  ORDER BY r.check_in DESC
  LIMIT 1;

  IF v_res.id IS NULL THEN
    RAISE EXCEPTION 'Código não encontrado ou hospedagem indisponível.';
  END IF;

  UPDATE public.reservations
  SET guest_id = auth.uid()
  WHERE id = v_res.id;

  RETURN QUERY SELECT v_res.id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_reservation(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.link_reservation(TEXT) TO authenticated;

-- Notificações automáticas de pedidos
CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  SELECT ur.user_id, 'Novo pedido ' || NEW.order_number,
         'Categoria: ' || NEW.category::text, 'order', '/admin/pedidos'
  FROM public.user_roles ur WHERE ur.role = 'admin';

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  SELECT a.host_id, 'Novo pedido no seu imóvel',
         NEW.order_number || ' — ' || NEW.category::text, 'order', '/proprietario/pedidos'
  FROM public.apartments a
  WHERE a.id = NEW.apartment_id AND a.host_id IS NOT NULL AND a.host_id <> NEW.user_id;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_order_created() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_order_created AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_created();

CREATE OR REPLACE FUNCTION public.notify_order_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, kind)
    VALUES (NEW.user_id, 'Pedido ' || NEW.order_number || ' atualizado',
            'Novo status: ' || NEW.status::text, 'status');
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_order_status() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_notify_order_status AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_order_status();