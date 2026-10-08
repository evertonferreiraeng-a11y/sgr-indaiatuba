-- ============================================================
-- PATCH 34 — Estoque: acondicionamento do material (Prensado / A granel)
--
-- Informado na tela Estoque. A Apresentação do Comitê usa este campo para
-- colocar o estoque no card certo da Composição de Vendas (ticket médio
-- "vendido + estoque"). Em branco: usa como o material mais foi vendido.
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS acondicionamento TEXT
  CHECK (acondicionamento IN ('prensa', 'granel'));

-- Conferência
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'materiais' AND column_name = 'acondicionamento';
