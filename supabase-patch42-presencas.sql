-- ============================================================
-- PATCH 42 — Lançar PRESENÇA nos dias úteis sem nenhum registro
--
-- Para cada colaborador, em cada dia útil (seg–sex, fora feriados) desde a
-- ADMISSÃO dele até ONTEM (ou até a demissão), se o dia NÃO tiver nenhuma
-- ocorrência lançada (presença, falta, atraso, férias, declaração,
-- advertência...), lança "Presente · Normal" (tipo 'outro') e marca
-- presenca_diaria = presente.
--
--   • Colaborador sem data de admissão: começa no 1º lançamento dele.
--   • Colaborador inativo sem data de demissão fica de fora.
--   • Dia que já tem qualquer registro NÃO é alterado.
--   • Feriados (mesmos do sistema, inclusive 09/12 e Sexta-feira Santa) ficam de fora.
--   • Pode rodar de novo: não duplica (pula os dias que já têm registro).
--
-- COMO USAR (SQL Editor do Supabase):
--   1) PASSO 1: prévia — quantos dias serão lançados por colaborador.
--   2) PASSO 2: grava.
--   3) PASSO 3: desfaz tudo que o passo 2 lançou (se precisar).
-- ============================================================


-- ── PASSO 1 — PRÉVIA (não grava nada) ────────────────────────
WITH fim AS (SELECT (NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1 AS dia),
colabs AS (
  SELECT c.id, c.nome,
         COALESCE(c.data_admissao, (SELECT MIN(o.data) FROM public.ocorrencias o WHERE o.colaborador_id = c.id)) AS inicio,
         LEAST(COALESCE(c.demissao, (SELECT dia FROM fim)), (SELECT dia FROM fim)) AS termino
  FROM public.colaboradores c
  WHERE c.ativo IS NOT FALSE OR c.demissao IS NOT NULL
),
pascoa AS (   -- Domingo de Páscoa (Meeus/Jones/Butcher) → Sexta-feira Santa = Páscoa - 2
  SELECT make_date(y, ((h + l - 7*m + 114) / 31), ((h + l - 7*m + 114) % 31) + 1) - 2 AS dia
  FROM (SELECT y, h, l, (a + 11*h + 22*l) / 451 AS m FROM (
    SELECT y, a, h, (32 + 2*e + 2*i - h - k) % 7 AS l FROM (
      SELECT y, a, e, i, k, (19*a + b - d - g + 15) % 30 AS h FROM (
        SELECT y, y % 19 AS a, y / 100 AS b, (y / 100) % 4 AS e, (y % 100) / 4 AS i, (y % 100) % 4 AS k,
               (y / 100) / 4 AS d, ((y / 100) - ((y / 100) + 8) / 25 + 1) / 3 AS g
        FROM generate_series(1990, 2040) y) s1) s2) s3) s4
),
feriados AS (
  SELECT make_date(a, m, d) AS dia
  FROM generate_series(1990, 2040) a,
       (VALUES (1,1),(4,21),(5,1),(9,7),(10,12),(11,2),(11,15),(11,20),(12,9),(12,25)) f(m, d)
  UNION SELECT dia FROM pascoa
),
alvo AS (
  SELECT c.id AS colaborador_id, c.nome, g::date AS dia
  FROM colabs c, generate_series(c.inicio, c.termino, '1 day') g
  WHERE c.inicio IS NOT NULL
    AND EXTRACT(ISODOW FROM g) <= 5
    AND g::date NOT IN (SELECT dia FROM feriados)
    AND NOT EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.colaborador_id = c.id AND o.data = g::date)
)
SELECT nome, COUNT(*) AS dias_a_lancar, MIN(dia) AS primeiro, MAX(dia) AS ultimo
FROM alvo GROUP BY nome ORDER BY nome;


-- ── PASSO 2 — GRAVAR ─────────────────────────────────────────
-- Guarda os ids lançados em "lote_presenca_42" para poder desfazer.
CREATE TABLE IF NOT EXISTS public.lote_presenca_42 (ocorrencia_id UUID, colaborador_id UUID, data DATE);

WITH fim AS (SELECT (NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1 AS dia),
colabs AS (
  SELECT c.id,
         COALESCE(c.data_admissao, (SELECT MIN(o.data) FROM public.ocorrencias o WHERE o.colaborador_id = c.id)) AS inicio,
         LEAST(COALESCE(c.demissao, (SELECT dia FROM fim)), (SELECT dia FROM fim)) AS termino
  FROM public.colaboradores c
  WHERE c.ativo IS NOT FALSE OR c.demissao IS NOT NULL
),
pascoa AS (
  SELECT make_date(y, ((h + l - 7*m + 114) / 31), ((h + l - 7*m + 114) % 31) + 1) - 2 AS dia
  FROM (SELECT y, h, l, (a + 11*h + 22*l) / 451 AS m FROM (
    SELECT y, a, h, (32 + 2*e + 2*i - h - k) % 7 AS l FROM (
      SELECT y, a, e, i, k, (19*a + b - d - g + 15) % 30 AS h FROM (
        SELECT y, y % 19 AS a, y / 100 AS b, (y / 100) % 4 AS e, (y % 100) / 4 AS i, (y % 100) % 4 AS k,
               (y / 100) / 4 AS d, ((y / 100) - ((y / 100) + 8) / 25 + 1) / 3 AS g
        FROM generate_series(1990, 2040) y) s1) s2) s3) s4
),
feriados AS (
  SELECT make_date(a, m, d) AS dia
  FROM generate_series(1990, 2040) a,
       (VALUES (1,1),(4,21),(5,1),(9,7),(10,12),(11,2),(11,15),(11,20),(12,9),(12,25)) f(m, d)
  UNION SELECT dia FROM pascoa
),
alvo AS (
  SELECT c.id AS colaborador_id, g::date AS dia
  FROM colabs c, generate_series(c.inicio, c.termino, '1 day') g
  WHERE c.inicio IS NOT NULL
    AND EXTRACT(ISODOW FROM g) <= 5
    AND g::date NOT IN (SELECT dia FROM feriados)
    AND NOT EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.colaborador_id = c.id AND o.data = g::date)
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

SELECT COUNT(*) AS presencas_lancadas_total FROM public.lote_presenca_42;


-- ── PASSO 3 — DESFAZER (só se precisar) ──────────────────────
-- DELETE FROM public.presenca_diaria p USING public.lote_presenca_42 l
--   WHERE p.colaborador_id = l.colaborador_id AND p.data = l.data;
-- DELETE FROM public.ocorrencias WHERE id IN (SELECT ocorrencia_id FROM public.lote_presenca_42);
-- DROP TABLE public.lote_presenca_42;
