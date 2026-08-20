-- Permite que o painel do proprietário receba imediatamente alterações
-- de vínculo, código e status dos seus imóveis.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'apartments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.apartments;
  END IF;
END $$;
