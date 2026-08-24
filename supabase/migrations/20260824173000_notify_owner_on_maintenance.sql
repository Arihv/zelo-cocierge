-- Notifica automaticamente o proprietário do imóvel quando um chamado
-- de manutenção é criado por um hóspede ou outro usuário.
CREATE OR REPLACE FUNCTION public.notify_apartment_owner_on_maintenance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id UUID;
  apartment_code TEXT;
BEGIN
  IF NEW.category <> 'manutencao'::public.order_category OR NEW.apartment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT a.host_id, a.code
    INTO owner_id, apartment_code
  FROM public.apartments a
  WHERE a.id = NEW.apartment_id;

  IF owner_id IS NULL OR owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  VALUES (
    owner_id,
    'Novo chamado de manutenção',
    'O chamado ' || NEW.order_number || ' foi aberto para o imóvel ' || COALESCE(apartment_code, 'sem código') || '.',
    'maintenance',
    '/proprietario/pedidos'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_owner_on_maintenance ON public.orders;
CREATE TRIGGER trg_notify_owner_on_maintenance
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_apartment_owner_on_maintenance();
