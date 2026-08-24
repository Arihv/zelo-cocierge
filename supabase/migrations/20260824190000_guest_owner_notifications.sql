-- Notificações pessoais para hóspedes e proprietários.
-- Administradores continuam recebendo as notificações operacionais pelo trigger administrativo.

CREATE OR REPLACE FUNCTION public.notify_guest_and_owner_on_order_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_user UUID;
  apartment_code TEXT;
  guest_title TEXT;
  guest_body TEXT;
  owner_title TEXT;
  owner_body TEXT;
BEGIN
  -- Descobre o proprietário do imóvel, quando houver apartamento vinculado.
  IF NEW.apartment_id IS NOT NULL THEN
    SELECT a.host_id, a.code
      INTO owner_user, apartment_code
    FROM public.apartments a
    WHERE a.id = NEW.apartment_id;
  END IF;

  -- HÓSPEDE: recebe confirmação do próprio pedido e mudanças de status.
  IF TG_OP = 'INSERT' THEN
    guest_title := CASE
      WHEN NEW.category = 'manutencao'::public.order_category
        THEN 'Chamado recebido'
      ELSE 'Pedido recebido'
    END;

    guest_body := CASE
      WHEN NEW.category = 'manutencao'::public.order_category
        THEN 'Seu chamado ' || NEW.order_number || ' foi recebido e será analisado pela equipe.'
      ELSE 'Seu pedido ' || NEW.order_number || ' foi recebido no valor de R$ ' ||
           to_char(COALESCE(NEW.total, 0), 'FM999G999G990D00') || '.'
    END;

    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, kind, link)
      VALUES (
        NEW.user_id,
        guest_title,
        guest_body,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/hospede/manutencao' ELSE '/hospede/historico' END
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, kind, link)
      VALUES (
        NEW.user_id,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Manutenção atualizada' ELSE 'Pedido atualizado' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category
          THEN 'O chamado ' || NEW.order_number || ' agora está como ' || NEW.status || '.'
          ELSE 'O pedido ' || NEW.order_number || ' agora está como ' || NEW.status || '.'
        END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/hospede/manutencao' ELSE '/hospede/historico' END
      );
    END IF;
  END IF;

  -- PROPRIETÁRIO: somente chamados de manutenção dos próprios imóveis.
  IF NEW.category = 'manutencao'::public.order_category
     AND owner_user IS NOT NULL
     AND owner_user IS DISTINCT FROM NEW.user_id THEN

    IF TG_OP = 'INSERT' THEN
      owner_title := 'Novo chamado de manutenção';
      owner_body := 'O chamado ' || NEW.order_number ||
                    ' foi aberto para o imóvel ' || COALESCE(apartment_code, 'sem código') || '.';
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      owner_title := 'Chamado de manutenção atualizado';
      owner_body := 'O chamado ' || NEW.order_number ||
                    ' do imóvel ' || COALESCE(apartment_code, 'sem código') ||
                    ' agora está como ' || NEW.status || '.';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (
      owner_user,
      owner_title,
      owner_body,
      'maintenance',
      '/proprietario/manutencao'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_guest_and_owner_on_order_activity ON public.orders;

CREATE TRIGGER trg_notify_guest_and_owner_on_order_activity
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_guest_and_owner_on_order_activity();
