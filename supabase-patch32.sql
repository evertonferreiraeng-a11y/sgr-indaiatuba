-- ============================================================
-- PATCH 32 — Tarefas: Plano de Ação do Comitê UVR Indaiatuba (25/09/2026)
--
-- 1) As tarefas atuais que não estão concluídas passam para "cancelada"
--    (saem do quadro ativo e da apresentação; nada é apagado)
-- 2) Cadastra as 5 ações da apresentação na categoria "Plano de Ação"
--    (é a categoria que o módulo Apresentação seleciona automaticamente)
-- ============================================================

BEGIN;

UPDATE public.tarefas
SET status = 'cancelada'
WHERE status <> 'concluida';

INSERT INTO public.tarefas (titulo, descricao, prioridade, status, categoria, responsavel, data_vencimento) VALUES
  ('Recompor a equipe para 13 colaboradores (3 contratações)',
   'Plano de Ação — Comitê UVR Indaiatuba 25/09/2026', 'media', 'em_andamento', 'Plano de Ação', 'GP/ Everton', '2026-10-07'),
  ('Vender o estoque de 11,80 t (R$ 26,1 mil) até o fechamento do mês',
   'Plano de Ação — Comitê UVR Indaiatuba 25/09/2026', 'media', 'em_andamento', 'Plano de Ação', 'Everton', '2026-09-29'),
  ('Priorizar a prensagem dos materiais para elevar o % prensado',
   'Plano de Ação — Comitê UVR Indaiatuba 25/09/2026', 'media', 'em_andamento', 'Plano de Ação', 'Everton/ Operação', NULL),
  ('Levantar a causa da baixa produção das prensas (1,4 t/dia × meta 3,1 t/dia)',
   'Plano de Ação — Comitê UVR Indaiatuba 25/09/2026', 'media', 'em_andamento', 'Plano de Ação', 'Everton', '2026-09-30'),
  ('Tratar a restrição da esteira 107-U011',
   'Plano de Ação — Comitê UVR Indaiatuba 25/09/2026', 'media', 'em_andamento', 'Plano de Ação', 'Everton', '2026-10-20');

COMMIT;

-- Conferência
SELECT titulo, responsavel, data_vencimento, status, categoria
FROM public.tarefas
WHERE status <> 'cancelada'
ORDER BY data_vencimento NULLS LAST;
