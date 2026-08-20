-- This project previously used text-based orders/reservations tables. Preserve them
-- for audit before the relational schema is created by the next migration.
DO $$
BEGIN
  IF to_regclass('public.orders') IS NOT NULL THEN
    IF to_regclass('public.legacy_orders') IS NOT NULL THEN
      RAISE EXCEPTION 'Both public.orders and public.legacy_orders exist. Inspect the database before continuing.';
    END IF;
    ALTER TABLE public.orders RENAME TO legacy_orders;
  END IF;

  IF to_regclass('public.reservations') IS NOT NULL THEN
    IF to_regclass('public.legacy_reservations') IS NOT NULL THEN
      RAISE EXCEPTION 'Both public.reservations and public.legacy_reservations exist. Inspect the database before continuing.';
    END IF;
    ALTER TABLE public.reservations RENAME TO legacy_reservations;
  END IF;
END $$;
