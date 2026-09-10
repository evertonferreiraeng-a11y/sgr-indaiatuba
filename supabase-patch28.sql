-- ============================================================
-- SGR Indaiatuba — Patch 28: Estoque mensal editável no
-- Plano de Expansão (junto com Passivo e Rejeito)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.plano_expansao_ajustes
  ADD COLUMN IF NOT EXISTS estoque_ton NUMERIC DEFAULT 0;
