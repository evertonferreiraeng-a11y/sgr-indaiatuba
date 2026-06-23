-- ============================================================
-- SGR Indaiatuba — Patch de Atualização
-- Execute no SQL Editor do Supabase APÓS o setup inicial
-- ============================================================

-- 1. Categoria nos materiais (reciclavel ou rejeito)
ALTER TABLE public.materiais
  ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'reciclavel'
  CHECK (categoria IN ('reciclavel', 'rejeito'));

-- 2. Novos campos em colaboradores
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS chapa TEXT;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS demissao DATE;

-- 3. Tabela de Cargos
CREATE TABLE IF NOT EXISTS public.cargos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela Equipe Diária
CREATE TABLE IF NOT EXISTS public.equipe_diaria (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data           DATE NOT NULL,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  criado_em      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, colaborador_id)
);

-- 5. Tabela Avaliações de Colaboradores
CREATE TABLE IF NOT EXISTS public.colaborador_avaliacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id  UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  pontualidade    NUMERIC CHECK (pontualidade BETWEEN 1 AND 10),
  produtividade   NUMERIC CHECK (produtividade BETWEEN 1 AND 10),
  qualidade       NUMERIC CHECK (qualidade BETWEEN 1 AND 10),
  trabalho_equipe NUMERIC CHECK (trabalho_equipe BETWEEN 1 AND 10),
  comprometimento NUMERIC CHECK (comprometimento BETWEEN 1 AND 10),
  observacao      TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RLS para novas tabelas
ALTER TABLE public.cargos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipe_diaria           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaborador_avaliacoes  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.cargos;
CREATE POLICY "leitura_autenticado" ON public.cargos
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "escrita_admin" ON public.cargos;
CREATE POLICY "escrita_admin" ON public.cargos
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "leitura_autenticado" ON public.equipe_diaria;
CREATE POLICY "leitura_autenticado" ON public.equipe_diaria
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "escrita_admin" ON public.equipe_diaria;
CREATE POLICY "escrita_admin" ON public.equipe_diaria
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "leitura_autenticado" ON public.colaborador_avaliacoes;
CREATE POLICY "leitura_autenticado" ON public.colaborador_avaliacoes
  FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "escrita_admin" ON public.colaborador_avaliacoes;
CREATE POLICY "escrita_admin" ON public.colaborador_avaliacoes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Cargos iniciais (opcional)
INSERT INTO public.cargos (nome) VALUES
  ('Operador de Triagem'),
  ('Operador de Prensa'),
  ('Auxiliar Operacional'),
  ('Motorista'),
  ('Encarregado'),
  ('Supervisor'),
  ('Administrativo')
ON CONFLICT DO NOTHING;
