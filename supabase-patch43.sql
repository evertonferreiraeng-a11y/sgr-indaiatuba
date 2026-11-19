-- ============================================================
-- PATCH 43 — Abono (dia abonado)
--
-- Novo tipo 'abono': dia abonado (ex.: saiu mais cedo com autorização).
-- Não conta como falta nem como presença. Já inclui os patches 38 a 41.
-- Pode rodar mais de uma vez. Execute no SQL Editor do Supabase.
-- ============================================================

ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS horas        NUMERIC(5,2);
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS horas_abono  NUMERIC(5,2);
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS hora_chegada TIME;

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
  CHECK (tipo IN ('falta','atestado','falta_declaracao','ferias','outro','atraso','declaracao','advertencia','elogio','abono'));

NOTIFY pgrst, 'reload schema';
