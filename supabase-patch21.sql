-- ============================================================
-- SGR Indaiatuba — Patch 21: % de Aproveitamento por Cliente
-- (tela Estudo de Cargas > Volumes de Entrada)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS aproveitamento_pct NUMERIC;
