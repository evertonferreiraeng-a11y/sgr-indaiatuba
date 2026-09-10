-- ============================================================
-- SGR Indaiatuba — Patch 22: Acondicionamento da venda (Prensa / A Granel)
-- (tela Comercial > Vendas > Faturamento por Produto)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.vendas
  ADD COLUMN IF NOT EXISTS acondicionamento TEXT
  CHECK (acondicionamento IN ('prensa', 'granel'));
