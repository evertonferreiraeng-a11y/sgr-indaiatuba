-- ============================================================
-- SGR Indaiatuba — Patch 30: Novos materiais (Apara)
-- Execute no SQL Editor do Supabase
-- ============================================================

INSERT INTO public.materiais (nome, unidade_medida)
SELECT 'APARA DE PLASTICO', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.materiais WHERE nome = 'APARA DE PLASTICO');

INSERT INTO public.materiais (nome, unidade_medida)
SELECT 'APARA DE PAPELÃO', 'kg'
WHERE NOT EXISTS (SELECT 1 FROM public.materiais WHERE nome = 'APARA DE PAPELÃO');
