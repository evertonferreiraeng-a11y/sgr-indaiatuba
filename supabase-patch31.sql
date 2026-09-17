-- ============================================================
-- SGR Indaiatuba — Patch 31: Meta de faturamento de setembro/2026
-- (usada na coluna "Meta" do Acompanhamento Semanal do Mês, em Comercial)
-- Execute no SQL Editor do Supabase
-- ============================================================

INSERT INTO public.metas (indicador, periodo, valor_meta)
SELECT 'faturamento', '2026-09', 141353.80
WHERE NOT EXISTS (
  SELECT 1 FROM public.metas WHERE indicador = 'faturamento' AND periodo = '2026-09'
);

-- Para cadastrar a meta de outros meses, repita trocando o periodo e o valor:
-- INSERT INTO public.metas (indicador, periodo, valor_meta) VALUES ('faturamento', '2026-10', 150000);
