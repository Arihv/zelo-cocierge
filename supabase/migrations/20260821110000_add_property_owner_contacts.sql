-- Proprietários cadastrados pela administração são contatos internos.
-- Eles não possuem credenciais, não recebem confirmação de e-mail e não têm acesso ao sistema.
CREATE TABLE IF NOT EXISTS public.property_owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_owners TO authenticated;

DROP POLICY IF EXISTS "Admins manage property owners" ON public.property_owners;
CREATE POLICY "Admins manage property owners"
  ON public.property_owners FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- O contato administrativo e a conta que acessa o painel passam a ser vínculos distintos.
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS property_owner_id UUID REFERENCES public.property_owners(id) ON DELETE SET NULL;

-- A conta de acesso é opcional: o imóvel pode ser controlado pela Zelo mesmo antes
-- de o proprietário receber ou utilizar um login.
ALTER TABLE public.apartments
  ALTER COLUMN host_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS apartments_property_owner_id_idx
  ON public.apartments(property_owner_id);

-- Garante que o novo fluxo de cadastro continue exclusivo da administração.
DROP POLICY IF EXISTS "Admins can insert apartments" ON public.apartments;
CREATE POLICY "Admins can insert apartments"
  ON public.apartments FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
