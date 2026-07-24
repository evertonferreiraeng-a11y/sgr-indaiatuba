-- ============================================================
-- SGR Indaiatuba — Patch 8: controle manual de estoque
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS no_estoque   BOOLEAN DEFAULT FALSE;
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS estoque_kg   NUMERIC  DEFAULT 0;
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC DEFAULT 0;
ALTER TABLE public.materiais ADD COLUMN IF NOT EXISTS observacao    TEXT;
