-- Execute este script no SQL Editor do Supabase para remover
-- definitivamente o módulo Financeiro (tabela e políticas).
-- ATENÇÃO: isso apaga permanentemente todos os lançamentos existentes.

DROP POLICY IF EXISTS "leitura_autenticado" ON public.financeiro_lancamentos;
DROP POLICY IF EXISTS "escrita_admin"       ON public.financeiro_lancamentos;

DROP TABLE IF EXISTS public.financeiro_lancamentos;
