-- ============================================================
-- SGR Indaiatuba — Patch 14: Garante as 3 colunas corretas
-- (Orgânico / Reciclável / Não Reciclável), não importa o estado
-- atual da tabela (idempotente — pode rodar quantas vezes precisar)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Garante que os 3 tipos existam e estejam ativos.
INSERT INTO public.tipos_carga (nome) VALUES ('Orgânico')
  ON CONFLICT (nome) DO UPDATE SET ativo = TRUE;

INSERT INTO public.tipos_carga (nome) VALUES ('Reciclável')
  ON CONFLICT (nome) DO UPDATE SET ativo = TRUE;

INSERT INTO public.tipos_carga (nome) VALUES ('Não Reciclável')
  ON CONFLICT (nome) DO UPDATE SET ativo = TRUE;

-- Qualquer outro tipo (Rejeito, Contaminado, UVR Ecoparque, Aterro
-- Indaiatuba, etc.) some das colunas — sem apagar histórico.
UPDATE public.tipos_carga SET ativo = FALSE
WHERE nome NOT IN ('Orgânico', 'Reciclável', 'Não Reciclável');

-- Conferência: deve devolver exatamente 3 linhas.
SELECT nome, ativo FROM public.tipos_carga WHERE ativo = TRUE ORDER BY nome;
