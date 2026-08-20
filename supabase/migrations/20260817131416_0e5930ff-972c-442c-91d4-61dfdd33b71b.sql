-- ENUMS
CREATE TYPE public.reservation_status AS ENUM ('pendente','confirmada','ativa','finalizada','cancelada');
CREATE TYPE public.order_status AS ENUM ('recebido','em_analise','confirmado','em_preparacao','em_entrega','concluido','cancelado');
CREATE TYPE public.order_category AS ENUM ('kit','mercado','limpeza','organizacao','servico','manutencao','operacional');
CREATE TYPE public.property_type AS ENUM ('S','D','T');

-- APARTMENTS: código do imóvel
ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS code TEXT;
UPDATE public.apartments a SET code = 'S' || lpad(n.rn::text, 3, '0')
FROM (SELECT id, row_number() OVER (ORDER BY created_at) AS rn FROM public.apartments WHERE code IS NULL) n
WHERE a.id = n.id AND a.code IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS apartments_code_key ON public.apartments (upper(code));

-- SERVICE CATALOG
CREATE TABLE public.service_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category public.order_category NOT NULL DEFAULT 'servico',
  audience TEXT NOT NULL DEFAULT 'guest',
  price_by_property BOOLEAN NOT NULL DEFAULT false,
  unit TEXT NOT NULL DEFAULT 'unidade',
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_catalog TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_catalog TO authenticated;
GRANT ALL ON public.service_catalog TO service_role;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view active services" ON public.service_catalog FOR SELECT TO authenticated USING (is_active = true OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins manage services insert" ON public.service_catalog FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins manage services update" ON public.service_catalog FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins manage services delete" ON public.service_catalog FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRICING
CREATE TABLE public.pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL REFERENCES public.service_catalog(key) ON DELETE CASCADE,
  property_type public.property_type,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pricing_unique_typed ON public.pricing (service_key, property_type) WHERE property_type IS NOT NULL;
CREATE UNIQUE INDEX pricing_unique_flat ON public.pricing (service_key) WHERE property_type IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pricing TO authenticated;
GRANT ALL ON public.pricing TO service_role;
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view pricing" ON public.pricing FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert pricing" ON public.pricing FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins update pricing" ON public.pricing FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins delete pricing" ON public.pricing FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER update_pricing_updated_at BEFORE UPDATE ON public.pricing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RESERVATIONS
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reservation_code TEXT NOT NULL UNIQUE,
  guest_name TEXT,
  guest_phone TEXT,
  address TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  status public.reservation_status NOT NULL DEFAULT 'confirmada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Guests view own reservations" ON public.reservations FOR SELECT TO authenticated USING (guest_id = auth.uid());
CREATE POLICY "Hosts view reservations of own apartments" ON public.reservations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.host_id = auth.uid()));
CREATE POLICY "Admins view all reservations" ON public.reservations FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Hosts and admins create reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role) OR EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.host_id = auth.uid()));
CREATE POLICY "Hosts and admins update reservations" ON public.reservations FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role) OR EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.host_id = auth.uid())) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role) OR EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.host_id = auth.uid()));
CREATE POLICY "Admins delete reservations" ON public.reservations FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDERS
CREATE SEQUENCE public.order_number_seq START 1000;
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE DEFAULT ('PED-' || lpad(nextval('public.order_number_seq')::text, 5, '0')),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
  apartment_id UUID REFERENCES public.apartments(id) ON DELETE SET NULL,
  category public.order_category NOT NULL,
  status public.order_status NOT NULL DEFAULT 'recebido',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  details TEXT,
  scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT USAGE ON SEQUENCE public.order_number_seq TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Hosts view orders of own apartments" ON public.orders FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id AND a.host_id = auth.uid()));
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Users create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins update any order" ON public.orders FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_key TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View items of visible orders" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id));
CREATE POLICY "Create items on own orders" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Admins update order items" ON public.order_items FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins delete order items" ON public.order_items FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));

-- PARTNERS
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  segment TEXT,
  benefit TEXT,
  description TEXT,
  contact TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated view active partners" ON public.partners FOR SELECT TO authenticated USING (is_active = true OR private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins insert partners" ON public.partners FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins update partners" ON public.partners FOR UPDATE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Admins delete partners" ON public.partners FOR DELETE TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  kind TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Authenticated create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'::public.app_role));

-- ACTIVITY LOGS
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON public.activity_logs FOR SELECT TO authenticated USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "Authenticated insert own logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- SEED: catálogo e preços
INSERT INTO public.service_catalog (key, name, description, category, audience, price_by_property, unit, icon, sort_order) VALUES
  ('limpeza_padrao','Limpeza adicional','Limpeza completa do imóvel durante a estadia.','limpeza','guest',true,'serviço','sparkles',1),
  ('organizacao_padrao','Organização adicional','Organização e arrumação completa do imóvel.','organizacao','guest',true,'serviço','clipboard-list',2),
  ('aluguel_manta','Aluguel de mantas','Manta extra macia para as noites frias.','servico','guest',false,'unidade','blanket',3),
  ('aluguel_travesseiro','Aluguel de travesseiros','Travesseiro extra de alta qualidade.','servico','guest',false,'unidade','bed-double',4),
  ('aquecedor_portatil','Aquecedor portátil extra','Aquecedor portátil adicional para o ambiente.','servico','guest',false,'unidade','flame',5),
  ('manutencao_geral','Manutenção geral','Solicitação de manutenção para o imóvel.','manutencao','host',false,'serviço','wrench',6),
  ('operacional_especial','Serviço especial','Demanda operacional especial para o proprietário.','operacional','host',false,'serviço','concierge-bell',7);

INSERT INTO public.pricing (service_key, property_type, price) VALUES
  ('limpeza_padrao','S',150.00),
  ('limpeza_padrao','D',210.00),
  ('limpeza_padrao','T',280.00),
  ('organizacao_padrao','S',120.00),
  ('organizacao_padrao','D',170.00),
  ('organizacao_padrao','T',220.00),
  ('aluguel_manta',NULL,35.00),
  ('aluguel_travesseiro',NULL,25.00),
  ('aquecedor_portatil',NULL,60.00),
  ('manutencao_geral',NULL,0.00),
  ('operacional_especial',NULL,0.00);