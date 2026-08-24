-- Notifica o hóspede quando o pagamento do próprio pedido muda.
-- Mantém as notificações operacionais de pagamento para administradores.

CREATE OR REPLACE FUNCTION public.notify_admins_on_order_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user UUID;
  notification_title TEXT;
  notification_body TEXT;
  notification_kind TEXT;
  notification_link TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    notification_title := CASE
      WHEN NEW.category = 'manutencao'::public.order_category THEN 'Novo chamado de manutenção'
      ELSE 'Novo pedido recebido'
    END;
    notification_body := CASE
      WHEN NEW.category = 'manutencao'::public.order_category THEN
        'O chamado ' || NEW.order_number || ' foi aberto e precisa de atenção.'
      ELSE
        'O pedido ' || NEW.order_number || ' foi criado no valor de R$ ' ||
        to_char(COALESCE(NEW.total, 0), 'FM999G999G990D00') || '.'
    END;
    notification_kind := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END;
    notification_link := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/admin/chamados' ELSE '/admin/pedidos' END;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    notification_title := 'Pedido atualizado';
    notification_body := 'O pedido ' || NEW.order_number || ' mudou para o status ' || NEW.status || '.';
    notification_kind := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END;
    notification_link := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/admin/chamados' ELSE '/admin/pedidos' END;

  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    notification_title := CASE NEW.payment_status
      WHEN 'approved' THEN 'Pagamento aprovado'
      WHEN 'rejected' THEN 'Pagamento recusado'
      WHEN 'cancelled' THEN 'Pagamento cancelado'
      ELSE 'Pagamento pendente'
    END;
    notification_body := 'O pagamento do pedido ' || NEW.order_number || ' está como ' || NEW.payment_status || '.';
    notification_kind := 'payment';
    notification_link := '/admin/pedidos';
  ELSE
    RETURN NEW;
  END IF;

  FOR admin_user IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (admin_user, notification_title, notification_body, notification_kind, notification_link);
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_order_activity ON public.orders;
CREATE TRIGGER trg_notify_admins_on_order_activity
AFTER INSERT OR UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_order_activity();

CREATE OR REPLACE FUNCTION public.notify_guest_and_owner_on_order_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_user UUID;
  apartment_code TEXT;
  title_text TEXT;
  body_text TEXT;
  kind_text TEXT;
  link_text TEXT;
BEGIN
  IF NEW.apartment_id IS NOT NULL THEN
    SELECT a.host_id, a.code INTO owner_user, apartment_code
    FROM public.apartments a WHERE a.id = NEW.apartment_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    title_text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Chamado recebido' ELSE 'Pedido recebido' END;
    body_text := CASE
      WHEN NEW.category = 'manutencao'::public.order_category THEN 'Seu chamado ' || NEW.order_number || ' foi recebido e será analisado pela equipe.'
      ELSE 'Seu pedido ' || NEW.order_number || ' foi recebido no valor de R$ ' || to_char(COALESCE(NEW.total, 0), 'FM999G999G990D00') || '.'
    END;
    kind_text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END;
    link_text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/hospede/manutencao' ELSE '/hospede/historico' END;

    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, kind, link)
      VALUES (NEW.user_id, title_text, body_text, kind_text, link_text);
    END IF;

  ELSIF TG_OP = 'UPDATE' AND OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, kind, link)
      VALUES (
        NEW.user_id,
        CASE NEW.payment_status WHEN 'approved' THEN 'Pagamento aprovado' WHEN 'rejected' THEN 'Pagamento recusado' WHEN 'cancelled' THEN 'Pagamento cancelado' ELSE 'Pagamento pendente' END,
        'O pagamento do pedido ' || NEW.order_number || ' está como ' || NEW.payment_status || '.',
        'payment',
        '/hospede/historico'
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, kind, link)
      VALUES (
        NEW.user_id,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Manutenção atualizada' ELSE 'Pedido atualizado' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'O chamado ' || NEW.order_number || ' agora está como ' || NEW.status || '.' ELSE 'O pedido ' || NEW.order_number || ' agora está como ' || NEW.status || '.' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END,
        CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/hospede/manutencao' ELSE '/hospede/historico' END
      );
    END IF;
  END IF;

  IF NEW.category = 'manutencao'::public.order_category AND owner_user IS NOT NULL AND owner_user IS DISTINCT FROM NEW.user_id THEN
    IF TG_OP = 'INSERT' THEN
      title_text := 'Novo chamado de manutenção';
      body_text := 'O chamado ' || NEW.order_number || ' foi aberto para o imóvel ' || COALESCE(apartment_code, 'sem código') || '.';
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
      title_text := 'Chamado de manutenção atualizado';
      body_text := 'O chamado ' || NEW.order_number || ' do imóvel ' || COALESCE(apartment_code, 'sem código') || ' agora está como ' || NEW.status || '.';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (owner_user, title_text, body_text, 'maintenance', '/proprietario/manutencao');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_guest_and_owner_on_order_activity ON public.orders;
CREATE TRIGGER trg_notify_guest_and_owner_on_order_activity
AFTER INSERT OR UPDATE OF status, payment_status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_guest_and_owner_on_order_activity();
