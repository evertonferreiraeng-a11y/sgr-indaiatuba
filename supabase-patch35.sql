-- ============================================================
-- PATCH 35 — Equipamentos: motivo no registro diário
--
-- Guarda em cada dia registrado o motivo da parada ou restrição, para o
-- histórico da tela Equipamentos (e a observação lida pelo Dashboard).
-- Sem esta coluna a tela continua funcionando, só não guarda o motivo.
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.equipamentos_snapshot
  ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Conferência
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'equipamentos_snapshot'
ORDER BY ordinal_position;
