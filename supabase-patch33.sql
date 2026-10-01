-- ============================================================
-- PATCH 33 — Tarefas: campo "Andamento" (o que foi feito / em que pé está)
--
-- Preenchido no módulo Tarefas e exibido na coluna "Andamento" do slide
-- Plano de Ação da Apresentação do Comitê.
-- ============================================================

ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS andamento TEXT;

-- Conferência
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tarefas' AND column_name = 'andamento';
