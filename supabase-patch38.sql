-- ============================================================
-- PATCH 38 — Novos tipos de ocorrência: Férias e Declaração
--
-- Libera os tipos 'ferias' e 'declaracao' na tabela ocorrencias.
-- Pode rodar mais de uma vez. Execute no SQL Editor do Supabase.
-- ============================================================

-- Remove a regra antiga que limitava os tipos (qualquer CHECK sobre a coluna tipo)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'ocorrencias'
      AND con.contype = 'c' AND pg_get_constraintdef(con.oid) ILIKE '%tipo%'
  LOOP
    EXECUTE format('ALTER TABLE public.ocorrencias DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.ocorrencias
  ADD CONSTRAINT ocorrencias_tipo_check
  CHECK (tipo IN ('falta','atestado','advertencia','elogio','outro','ferias','declaracao'));

NOTIFY pgrst, 'reload schema';

-- OPCIONAL: as justificadas lançadas antes desta mudança ficaram sem
-- "conta como falta". Para que passem a contar no KPI de faltas do RH,
-- tire os dois traços do começo da linha abaixo e rode:
-- UPDATE public.ocorrencias SET conta_como_falta = true WHERE tipo = 'atestado' AND conta_como_falta IS NOT TRUE;
