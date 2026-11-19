-- ============================================================
-- PATCH 42 — Lançar PRESENÇA nos dias úteis sem nenhum registro
--
-- Para cada colaborador, em cada dia útil (seg–sex, fora feriados) entre
-- o INÍCIO e o FIM abaixo, se o dia NÃO tiver nenhuma ocorrência lançada
-- (presença, falta, atraso, férias, declaração, advertência...), lança
-- "Presente · Normal" (tipo 'outro') e marca presenca_diaria = presente.
--
--   • Só a partir da admissão e só até a demissão de cada um.
--   • Colaborador inativo sem data de demissão fica de fora.
--   • Dia que já tem qualquer registro NÃO é alterado.
--   • Feriados (mesmos do sistema, inclusive 09/12) ficam de fora.
--
-- COMO USAR (SQL Editor do Supabase):
--   1) Rode só o PASSO 1 (selecione e execute) para ver quantos dias serão
--      lançados por colaborador. Confira.
--   2) Rode o PASSO 2 para gravar.
--   3) Se precisar desfazer, rode o PASSO 3.
-- ============================================================


-- ── PASSO 1 — PRÉVIA (não grava nada) ────────────────────────
WITH params AS (
  SELECT
    (SELECT MIN(data) FROM public.ocorrencias)              AS inicio,  -- início = 1º lançamento no sistema
    ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1)     AS fim      -- até ontem
),
feriados AS (
  SELECT make_date(a, m, d) AS dia
  FROM generate_series(2024, 2030) a,
       (VALUES (1,1),(4,21),(5,1),(9,7),(10,12),(11,2),(11,15),(11,20),(12,9),(12,25)) f(m, d)
  UNION SELECT unnest(ARRAY['2024-03-29','2025-04-18','2026-04-03','2027-03-26','2028-04-14','2029-03-30','2030-04-19']::date[])  -- Sexta-feira Santa
),
dias AS (
  SELECT g::date AS dia FROM params, generate_series(params.inicio, params.fim, '1 day') g
  WHERE EXTRACT(ISODOW FROM g) <= 5 AND g::date NOT IN (SELECT dia FROM feriados)
),
alvo AS (
  SELECT c.id AS colaborador_id, c.nome, d.dia
  FROM public.colaboradores c
  JOIN dias d ON d.dia >= COALESCE(c.data_admissao, d.dia)
             AND d.dia <= COALESCE(c.demissao, d.dia)
  WHERE (c.ativo IS NOT FALSE OR c.demissao IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.colaborador_id = c.id AND o.data = d.dia)
)
SELECT nome, COUNT(*) AS dias_a_lancar, MIN(dia) AS primeiro, MAX(dia) AS ultimo
FROM alvo GROUP BY nome ORDER BY nome;


-- ── PASSO 2 — GRAVAR ─────────────────────────────────────────
-- Guarda os ids lançados em "lote_presenca_42" para poder desfazer.
CREATE TABLE IF NOT EXISTS public.lote_presenca_42 (ocorrencia_id UUID, colaborador_id UUID, data DATE);

WITH params AS (
  SELECT
    (SELECT MIN(data) FROM public.ocorrencias)              AS inicio,
    ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1)     AS fim
),
feriados AS (
  SELECT make_date(a, m, d) AS dia
  FROM generate_series(2024, 2030) a,
       (VALUES (1,1),(4,21),(5,1),(9,7),(10,12),(11,2),(11,15),(11,20),(12,9),(12,25)) f(m, d)
  UNION SELECT unnest(ARRAY['2024-03-29','2025-04-18','2026-04-03','2027-03-26','2028-04-14','2029-03-30','2030-04-19']::date[])
),
dias AS (
  SELECT g::date AS dia FROM params, generate_series(params.inicio, params.fim, '1 day') g
  WHERE EXTRACT(ISODOW FROM g) <= 5 AND g::date NOT IN (SELECT dia FROM feriados)
),
alvo AS (
  SELECT c.id AS colaborador_id, d.dia
  FROM public.colaboradores c
  JOIN dias d ON d.dia >= COALESCE(c.data_admissao, d.dia)
             AND d.dia <= COALESCE(c.demissao, d.dia)
  WHERE (c.ativo IS NOT FALSE OR c.demissao IS NOT NULL)
    AND NOT EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.colaborador_id = c.id AND o.data = d.dia)
),
ins AS (
  INSERT INTO public.ocorrencias (colaborador_id, data, tipo, descricao, conta_como_falta)
  SELECT colaborador_id, dia, 'outro', NULL, false FROM alvo
  RETURNING id, colaborador_id, data
),
pres AS (
  INSERT INTO public.presenca_diaria (colaborador_id, data, presente)
  SELECT colaborador_id, data, true FROM ins
  ON CONFLICT (colaborador_id, data) DO UPDATE SET presente = true
  RETURNING 1
)
INSERT INTO public.lote_presenca_42 (ocorrencia_id, colaborador_id, data)
SELECT id, colaborador_id, data FROM ins;

SELECT COUNT(*) AS presencas_lancadas FROM public.lote_presenca_42;


-- ── PASSO 3 — DESFAZER (só se precisar) ──────────────────────
-- DELETE FROM public.presenca_diaria p USING public.lote_presenca_42 l
--   WHERE p.colaborador_id = l.colaborador_id AND p.data = l.data;
-- DELETE FROM public.ocorrencias WHERE id IN (SELECT ocorrencia_id FROM public.lote_presenca_42);
-- DROP TABLE public.lote_presenca_42;
