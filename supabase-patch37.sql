-- ============================================================
-- PATCH 37 — Observações livres do colaborador
--
-- Campo de texto livre na ficha do colaborador
-- (tela colaborador-ocorrencias.html), com data e autor da última edição.
-- Pode rodar mais de uma vez. Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS anotacoes      TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS anotacoes_em   TIMESTAMPTZ;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS anotacoes_por  TEXT;

-- Atualiza o cache do PostgREST para a coluna nova aparecer na API na hora
NOTIFY pgrst, 'reload schema';
