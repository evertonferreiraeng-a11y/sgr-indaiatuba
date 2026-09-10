-- ============================================================
-- SGR Indaiatuba — Patch 25: Corrige data de aprovação e detalha
-- composição da equipe no Plano de Expansão
-- (o plano foi aprovado em 14/08, não 01/09)
-- Execute no SQL Editor do Supabase
-- ============================================================

UPDATE public.plano_expansao_marcos
SET data = '2026-08-14',
    observacao = 'Aprovação do plano: equipe inicial de 4 Servente de Usina de Tratamento de Lixo + 1 Operador de Máquinas B'
WHERE data = '2026-09-01';

UPDATE public.plano_expansao_marcos
SET observacao = 'Início de +1 Servente de Usina de Tratamento de Lixo (equipe: 5 Servente de Usina de Tratamento de Lixo + 1 Operador de Máquinas B)'
WHERE data = '2026-09-09' AND colaboradores_ativos = 6;
