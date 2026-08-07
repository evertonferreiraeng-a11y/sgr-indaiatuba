-- ============================================================
-- SGR Indaiatuba — Patch 21: % de Aproveitamento por Fornecedor
-- (tela Estudo de Cargas > Volumes de Entrada)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS aproveitamento_pct NUMERIC;
