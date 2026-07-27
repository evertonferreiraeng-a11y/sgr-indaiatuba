-- ============================================================
-- SGR Indaiatuba — Patch 15: Campo de observação no cargo
-- (para anotar nº de protocolo das vagas em aberto, etc.)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.cargos
  ADD COLUMN IF NOT EXISTS observacao text;
