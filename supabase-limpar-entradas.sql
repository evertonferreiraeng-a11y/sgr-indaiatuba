-- Execute este script no SQL Editor do Supabase para apagar
-- TODOS os registros de Entradas (todas as datas).
-- ATENÇÃO: isso é permanente e não pode ser desfeito.
--
-- Os movimentos de estoque já gerados por essas entradas NÃO são
-- tocados por este script (ficam órfãos, referenciando uma entrada
-- que não existe mais) — essa foi uma escolha explícita, não apague
-- a tabela estoque_movimentacoes junto sem confirmar antes.
--
-- Isso também zera os números de Entradas que aparecem no Dashboard,
-- na Produção (eficiência) e nos Relatórios, já que todos calculam
-- a partir dessa tabela.

DELETE FROM public.entradas;
