-- Permite salvar o CPF do hóspede/proprietário no perfil, para não precisar
-- redigitar em todo checkout.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
