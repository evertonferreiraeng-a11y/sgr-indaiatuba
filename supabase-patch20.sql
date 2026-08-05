-- ============================================================
-- SGR Indaiatuba — Patch 20: Fornecedor contabilizado como Rejeito
-- (ex.: P.M. PILAR DO SUL — cliente cujo material recebido não é
-- reciclável de fato; todo o volume desse fornecedor deve contar
-- como Rejeito UVR em vez de Volume Recebido)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.fornecedores
  ADD COLUMN IF NOT EXISTS conta_como_rejeito BOOLEAN NOT NULL DEFAULT FALSE;
