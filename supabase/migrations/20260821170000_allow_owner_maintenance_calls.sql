-- Proprietários podem abrir chamados de manutenção somente para os próprios imóveis.
-- Hóspedes continuam podendo criar pedidos apenas para a reserva vinculada à sua conta.
DROP POLICY IF EXISTS "Guests create own reservation orders" ON public.orders;

CREATE POLICY "Guests and owners create authorized orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.reservations r
        WHERE r.id = reservation_id
          AND r.apartment_id = apartment_id
          AND r.guest_id = auth.uid()
          AND r.status IN ('confirmada', 'ativa')
      )
      OR (
        category = 'manutencao'::public.order_category
        AND EXISTS (
          SELECT 1
          FROM public.apartments a
          WHERE a.id = apartment_id
            AND a.host_id = auth.uid()
        )
      )
    )
  );
