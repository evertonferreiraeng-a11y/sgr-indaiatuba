-- ============================================================
-- SGR Indaiatuba — Patch 2
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Novos critérios de avaliação de colaboradores
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS relacionamento       NUMERIC CHECK (relacionamento       BETWEEN 1 AND 10);
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS responsabilidade     NUMERIC CHECK (responsabilidade     BETWEEN 1 AND 10);
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS cooperacao           NUMERIC CHECK (cooperacao           BETWEEN 1 AND 10);
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS conhecimento_trabalho NUMERIC CHECK (conhecimento_trabalho BETWEEN 1 AND 10);
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS interesse            NUMERIC CHECK (interesse            BETWEEN 1 AND 10);
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS atitude_profissional NUMERIC CHECK (atitude_profissional BETWEEN 1 AND 10);
-- produtividade já existe na tabela
