-- Compatibilidade para instalações antigas de push_subscriptions.
ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Garante que registros antigos tenham last_seen_at preenchido.
UPDATE public.push_subscriptions
SET last_seen_at = COALESCE(last_seen_at, created_at, now())
WHERE last_seen_at IS NULL;
