-- ============================================================
-- PATCH 36 — DRE (Demonstração do Resultado)
--
-- Tabelas da tela dre.html: unidades, plano de contas e lançamentos
-- mensais (realizado e orçado), mais a view agregada vw_dre_mensal.
-- Permissões no padrão do SGR: qualquer usuário logado lê,
-- só administrador grava.
-- Pode rodar mais de uma vez. Execute no SQL Editor do Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.dre_unidades (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome   TEXT NOT NULL UNIQUE,
  ativo  BOOLEAN NOT NULL DEFAULT TRUE
);

-- grupo = linha da DRE; natureza (fixo/variavel) alimenta o ponto de equilíbrio
CREATE TABLE IF NOT EXISTS public.dre_contas (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo    TEXT NOT NULL UNIQUE,
  nome      TEXT NOT NULL,
  grupo     TEXT NOT NULL CHECK (grupo IN ('receita_bruta','deducoes','custos','despesas','depreciacao','financeiro','ir_csll')),
  natureza  TEXT NOT NULL DEFAULT 'fixo' CHECK (natureza IN ('fixo','variavel')),
  ordem     INT  NOT NULL DEFAULT 0,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE
);

-- valor positivo; o sinal vem do grupo (financeiro e acertos aceitam negativo)
CREATE TABLE IF NOT EXISTS public.dre_lancamentos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id   UUID NOT NULL REFERENCES public.dre_unidades(id) ON DELETE CASCADE,
  conta_id     UUID NOT NULL REFERENCES public.dre_contas(id) ON DELETE RESTRICT,
  competencia  DATE NOT NULL CHECK (EXTRACT(DAY FROM competencia) = 1),
  tipo         TEXT NOT NULL DEFAULT 'realizado' CHECK (tipo IN ('realizado','orcado')),
  valor        NUMERIC(14,2) NOT NULL,
  observacao   TEXT,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_por   UUID DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS idx_dre_lanc_comp ON public.dre_lancamentos (unidade_id, competencia, tipo);

CREATE OR REPLACE VIEW public.vw_dre_mensal AS
SELECT l.unidade_id, u.nome AS unidade, l.competencia, l.tipo,
       c.id AS conta_id, c.codigo, c.nome AS conta, c.grupo, c.natureza, c.ordem,
       SUM(l.valor) AS valor
FROM public.dre_lancamentos l
JOIN public.dre_contas   c ON c.id = l.conta_id
JOIN public.dre_unidades u ON u.id = l.unidade_id
GROUP BY 1,2,3,4,5,6,7,8,9,10;
ALTER VIEW public.vw_dre_mensal SET (security_invoker = on);

-- Permissões (substitui as políticas abertas da primeira versão)
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['dre_unidades','dre_contas','dre_lancamentos'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_auth', t);
    EXECUTE format('DROP POLICY IF EXISTS "leitura_autenticado" ON public.%I', t);
    EXECUTE format('CREATE POLICY "leitura_autenticado" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')', t);
    EXECUTE format('DROP POLICY IF EXISTS "escrita_admin" ON public.%I', t);
    EXECUTE format('CREATE POLICY "escrita_admin" ON public.%I FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin''))', t);
  END LOOP;
END $$;

-- Unidade e plano de contas no padrão do Portal Gerencial da Corpus
INSERT INTO public.dre_unidades (nome) VALUES ('UVR Indaiatuba') ON CONFLICT (nome) DO NOTHING;

INSERT INTO public.dre_contas (codigo, nome, grupo, natureza, ordem) VALUES
  ('P01','Receita bruta (Portal)','receita_bruta','variavel',1),
  ('P02','Impostos sobre a receita','deducoes','variavel',2),
  ('P03','Cancelamentos','deducoes','variavel',3),
  ('P04','Acerto entre obras (+/-)','deducoes','variavel',4),
  ('P05','Custos','custos','fixo',5),
  ('P06','Despesas operacionais','despesas','fixo',6),
  ('P07','Backoffice ADM (6,5% RL)','despesas','variavel',7),
  ('P08','Depreciação gerencial','depreciacao','fixo',8),
  ('P09','Despesa financeira','financeiro','fixo',9),
  ('P10','Receita financeira','financeiro','fixo',10),
  ('P11','Impostos/contribuições (IR/CS 34% EBT)','ir_csll','variavel',11)
ON CONFLICT (codigo) DO NOTHING;

-- Conferência
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename LIKE 'dre%' ORDER BY 1, 2;
