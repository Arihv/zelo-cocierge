-- Dados do hóspede ficam congelados no pedido para auditoria/cobrança,
-- mesmo que o perfil ou a reserva sejam alterados depois.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_cpf TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT;

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS observation TEXT;

COMMENT ON COLUMN public.orders.customer_cpf IS 'CPF informado pelo hóspede no momento da compra; armazenado como dado de cobrança do pedido.';
COMMENT ON COLUMN public.orders.customer_email IS 'E-mail informado pelo hóspede no momento da compra.';
COMMENT ON COLUMN public.orders.customer_phone IS 'Telefone informado pelo hóspede no momento da compra.';
COMMENT ON COLUMN public.order_items.observation IS 'Observação específica do item, como sabor ou marca desejada.';
