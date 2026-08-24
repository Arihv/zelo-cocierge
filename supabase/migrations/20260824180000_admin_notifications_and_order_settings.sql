-- Corrige o roteamento: notificações internas ficam somente com administradores.
DROP TRIGGER IF EXISTS trg_notify_owner_on_maintenance ON public.orders;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  minimum_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (id, minimum_order_amount, delivery_fee)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

GRANT SELECT ON public.site_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins manage site settings" ON public.site_settings;

CREATE POLICY "Authenticated view site settings"
  ON public.site_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

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
        'O pedido ' || NEW.order_number || ' foi criado no valor de R$ ' || to_char(COALESCE(NEW.total, 0), 'FM999G999G990D00') || '.'
    END;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    notification_title := 'Pedido atualizado';
    notification_body := 'O pedido ' || NEW.order_number || ' mudou para o status ' || NEW.status || '.';
  ELSE
    RETURN NEW;
  END IF;

  FOR admin_user IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::public.app_role
  LOOP
    INSERT INTO public.notifications (user_id, title, body, kind, link)
    VALUES (
      admin_user,
      notification_title,
      notification_body,
      CASE WHEN NEW.category = 'manutencao'::public.order_category THEN 'maintenance' ELSE 'order' END,
      CASE WHEN NEW.category = 'manutencao'::public.order_category THEN '/admin/chamados' ELSE '/admin/pedidos' END
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_on_order_activity ON public.orders;
CREATE TRIGGER trg_notify_admins_on_order_activity
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_order_activity();

CREATE OR REPLACE FUNCTION public.touch_site_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER trg_touch_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_site_settings_updated_at();
