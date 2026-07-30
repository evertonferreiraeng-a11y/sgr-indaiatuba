-- ============================================================
-- SGR Indaiatuba — Patch 17: Campo de anotações/cálculos livres
-- na página de detalhe de cada Plano de Ação
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.planos_acao
  ADD COLUMN IF NOT EXISTS anotacoes TEXT;
