-- A plataforma deixou de exigir uma reserva formal para hóspedes fazerem
-- pedidos (mercado, kits, serviços, limpeza, organização, manutenção) e
-- passou a identificar a hospedagem apenas pelo código do imóvel informado.
-- A política antiga ainda exigia uma reserva ativa vinculada (para hóspedes)
-- ou limitava proprietários a mercado/manutenção, bloqueando com 403 os
-- demais fluxos (checkout do hóspede, kits do proprietário, serviços,
-- limpeza, organização). Esta migration alinha a regra do banco com o
-- comportamento já implementado no aplicativo: qualquer usuário autenticado
-- pode criar pedidos para si mesmo, opcionalmente vinculados a um imóvel
-- realmente cadastrado.
DROP POLICY IF EXISTS "Guests and owners create authorized orders" ON public.orders;
DROP POLICY IF EXISTS "Guests create own reservation orders" ON public.orders;

CREATE POLICY "Authenticated users create own orders"
ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    apartment_id IS NULL
    OR EXISTS (SELECT 1 FROM public.apartments a WHERE a.id = apartment_id)
  )
);
