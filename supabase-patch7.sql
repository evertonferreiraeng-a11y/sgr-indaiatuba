-- ============================================================
-- SGR Indaiatuba — Patch 7: valor_unitario e observacao em materiais
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC DEFAULT 0;
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS observacao      TEXT;
