-- Direciona os chamados de manutenção para a central própria da administração.
CREATE OR REPLACE FUNCTION public.notify_order_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_title text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Novo chamado de manutenção' ELSE 'Novo pedido ' || NEW.order_number END;
  v_admin_body text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Um proprietário abriu um chamado para atendimento.' ELSE 'Categoria: ' || NEW.category::text END;
  v_admin_link text := CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/admin/chamados' ELSE '/admin/pedidos' END;
BEGIN
  INSERT INTO public.notifications (user_id, title, body, kind, link)
  SELECT ur.user_id, v_admin_title, v_admin_body, 'order', v_admin_link
  FROM public.user_roles ur WHERE ur.role = 'admin';

  INSERT INTO public.notifications (user_id, title, body, kind, link)
  SELECT a.host_id,
         CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'Seu chamado de manutenção foi enviado' ELSE 'Novo pedido no seu imóvel' END,
         NEW.order_number || ' — ' || NEW.category::text,
         'order', '/proprietario/pedidos'
  FROM public.apartments a
  WHERE a.id = NEW.apartment_id AND a.host_id IS NOT NULL AND a.host_id <> NEW.user_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_order_created() FROM PUBLIC, anon, authenticated;
