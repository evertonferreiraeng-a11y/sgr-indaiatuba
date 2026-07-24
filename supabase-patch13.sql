-- ============================================================
-- SGR Indaiatuba — Patch 13: Ajusta as colunas de tipo de carga
-- para Orgânico / Reciclável / Não Reciclável
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Renomeia "Rejeito" para "Não Reciclável" (mantém o histórico de
-- estudos/destinos já vinculados a esse tipo, só muda o nome exibido).
UPDATE public.tipos_carga SET nome = 'Não Reciclável' WHERE nome = 'Rejeito';

-- "Contaminado" some das colunas (desativa, não apaga).
UPDATE public.tipos_carga SET ativo = FALSE WHERE nome = 'Contaminado';

-- "Reciclável" e "Orgânico" já existem com o nome certo, nada a fazer.
