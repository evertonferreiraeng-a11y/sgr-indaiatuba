-- ============================================================
-- SGR Indaiatuba — Patch 5: Colunas faltando em colaboradores
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cpf               TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS telefone          TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cargo_id          UUID REFERENCES public.cargos(id);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS fim_experiencia_1 DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS fim_experiencia_2 DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS ativo             BOOLEAN DEFAULT TRUE;

-- Marca ativos os que não têm demissão
UPDATE public.colaboradores SET ativo = TRUE WHERE demissao IS NULL AND ativo IS NULL;
