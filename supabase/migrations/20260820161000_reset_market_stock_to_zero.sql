-- Início operacional: preserva o catálogo e zera somente as quantidades.
-- Use antes da primeira conferência física do minimercado.
UPDATE public.products
SET stock = 0;
