-- Execute este script no SQL Editor do Supabase para apagar
-- as pesagens de ENTRADA (tipo_movimentacao = 'entrada') registradas
-- em julho de 2026. Pesagens de SAÍDA (ex: rejeito UVR) não são tocadas.
--
-- ATENÇÃO: isso é permanente e não pode ser desfeito.
--
-- Os movimentos de estoque já gerados por essas entradas (tabela
-- estoque_movimentacoes) NÃO são apagados por este script — ficariam
-- órfãos, referenciando uma entrada que não existe mais. Se quiser
-- removê-los também, descomente o segundo DELETE abaixo, mas confirme
-- antes que é isso que você quer.
--
-- Isso também reduz os números de Entradas que aparecem no Dashboard,
-- na Produção (eficiência) e nos Relatórios referentes a julho/2026.

-- 1) Confira antes de apagar: quantos e quais registros serão afetados
SELECT id, data, fornecedor_id, material_id, peso_liquido, peso_liquido_descontos
FROM public.entradas
WHERE data >= '2026-07-01' AND data <= '2026-07-31'
  AND (tipo_movimentacao = 'entrada' OR tipo_movimentacao IS NULL)
ORDER BY data;

-- 2) Apaga as pesagens de entrada de julho/2026
DELETE FROM public.entradas
WHERE data >= '2026-07-01' AND data <= '2026-07-31'
  AND (tipo_movimentacao = 'entrada' OR tipo_movimentacao IS NULL);

-- 3) (Opcional) Remove também os movimentos de estoque órfãos gerados
--    por essas entradas. Descomente se quiser executar.
-- DELETE FROM public.estoque_movimentacoes
-- WHERE origem_tipo = 'entrada'
--   AND origem_id NOT IN (SELECT id FROM public.entradas);
