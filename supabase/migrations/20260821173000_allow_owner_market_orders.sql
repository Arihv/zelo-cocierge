-- Proprietários podem comprar itens do mercado somente para imóveis vinculados a eles.
DROP POLICY IF EXISTS "Guests and owners create authorized orders" ON public.orders;

CREATE POLICY "Guests and owners create authorized orders"
ON public.orders
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND (
    EXISTS (
      SELECT 1 FROM public.reservations r
      WHERE r.id = reservation_id
        AND r.apartment_id = apartment_id
        AND r.guest_id = auth.uid()
        AND r.status IN ('confirmada', 'ativa')
    )
    OR (
      category IN ('manutencao'::public.order_category, 'mercado'::public.order_category)
      AND EXISTS (
        SELECT 1 FROM public.apartments a
        WHERE a.id = apartment_id AND a.host_id = auth.uid()
      )
    )
  )
);
