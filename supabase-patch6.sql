-- ============================================================
-- SGR Indaiatuba — Patch 6: Critérios faltando em colaborador_avaliacoes
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS relacionamento       NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS responsabilidade     NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS cooperacao           NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS conhecimento_trabalho NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS interesse            NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS atitude_profissional NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS produtividade        NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS nota_media           NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS data_avaliacao       DATE;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS periodo              TEXT;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS avaliador            TEXT;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS observacoes          TEXT;

-- Preenche data_avaliacao com data existente para registros antigos
UPDATE public.colaborador_avaliacoes SET data_avaliacao = data WHERE data_avaliacao IS NULL;
