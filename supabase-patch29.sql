-- ============================================================
-- SGR Indaiatuba — Patch 29: Capacidade mensal por equipamento
-- (usada no acompanhamento de Meta x Produção, tela Produção)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.equipamentos
  ADD COLUMN IF NOT EXISTS capacidade_kg_mes NUMERIC;
