-- ============================================================
-- PATCH 39 — Ocorrência: situação (Presente/Falta) + motivo + horas
--
-- 1) Coluna "horas" para a declaração de horas
-- 2) Novo tipo 'falta_declaracao': faltou o dia e trouxe declaração
--    só de algumas horas (conta como falta)
-- Pode rodar mais de uma vez. Execute no SQL Editor do Supabase.
-- (Já inclui o patch 38: não precisa rodar o 38 antes.)
-- ============================================================

ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS horas NUMERIC(5,2);

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
  CHECK (tipo IN ('falta','atestado','falta_declaracao','ferias','outro','declaracao','advertencia','elogio'));

NOTIFY pgrst, 'reload schema';
