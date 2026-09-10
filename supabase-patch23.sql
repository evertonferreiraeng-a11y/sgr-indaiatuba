-- ============================================================
-- SGR Indaiatuba — Patch 23: Preenchimento retroativo do
-- acondicionamento (Prensa / Granel) nas vendas já lançadas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Cartonifício Valinhos, Jonasi (t) e Rodoanel Ambiental (t) → Prensa
UPDATE public.vendas v
SET acondicionamento = 'prensa'
FROM public.clientes c
WHERE v.cliente_id = c.id
  AND (
    c.nome ILIKE 'Cartonif%'
    OR c.nome ILIKE 'Jonasi%'
    OR c.nome ILIKE 'Rodoanel Ambiental%'
  );

-- Demais clientes → Granel
UPDATE public.vendas v
SET acondicionamento = 'granel'
FROM public.clientes c
WHERE v.cliente_id = c.id
  AND NOT (
    c.nome ILIKE 'Cartonif%'
    OR c.nome ILIKE 'Jonasi%'
    OR c.nome ILIKE 'Rodoanel Ambiental%'
  );
