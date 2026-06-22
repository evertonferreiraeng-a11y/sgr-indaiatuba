-- ============================================================
-- SGR Indaiatuba — Supabase Setup SQL
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. PROFILES (espelho de auth.users com role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'visitante' CHECK (role IN ('admin', 'visitante')),
  ativo      BOOLEAN DEFAULT TRUE,
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cria profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    'visitante'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capacidade_galpao_kg NUMERIC,
  atualizado_em        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FORNECEDORES
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  contato   TEXT,
  ativo     BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MATERIAIS
CREATE TABLE IF NOT EXISTS public.materiais (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  unidade_medida  TEXT DEFAULT 'kg',
  ativo           BOOLEAN DEFAULT TRUE,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EQUIPAMENTOS
CREATE TABLE IF NOT EXISTS public.equipamentos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              TEXT NOT NULL,
  capacidade_kg_dia NUMERIC,
  ativo             BOOLEAN DEFAULT TRUE,
  criado_em         TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL,
  documento TEXT,
  contato   TEXT,
  ativo     BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. COLABORADORES
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome           TEXT NOT NULL,
  cargo          TEXT,
  data_admissao  DATE,
  ativo          BOOLEAN DEFAULT TRUE,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ENTRADAS
CREATE TABLE IF NOT EXISTS public.entradas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id  UUID NOT NULL REFERENCES public.fornecedores(id),
  material_id    UUID NOT NULL REFERENCES public.materiais(id),
  peso_kg        NUMERIC NOT NULL,
  valor          NUMERIC NOT NULL,
  data           DATE NOT NULL,
  criado_por     UUID REFERENCES public.profiles(id),
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PRODUÇÃO
CREATE TABLE IF NOT EXISTS public.producao (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id     UUID NOT NULL REFERENCES public.equipamentos(id),
  material_id        UUID NOT NULL REFERENCES public.materiais(id),
  peso_produzido_kg  NUMERIC NOT NULL,
  operador_id        UUID REFERENCES public.colaboradores(id),
  data               DATE NOT NULL,
  criado_por         UUID REFERENCES public.profiles(id),
  criado_em          TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ESTOQUE MOVIMENTAÇÕES
CREATE TABLE IF NOT EXISTS public.estoque_movimentacoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES public.materiais(id),
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  peso_kg     NUMERIC NOT NULL,
  origem_tipo TEXT NOT NULL CHECK (origem_tipo IN ('entrada', 'producao', 'venda', 'ajuste')),
  origem_id   UUID,
  data        DATE NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 11. VENDAS
CREATE TABLE IF NOT EXISTS public.vendas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID NOT NULL REFERENCES public.clientes(id),
  material_id UUID NOT NULL REFERENCES public.materiais(id),
  peso_kg     NUMERIC NOT NULL,
  valor_total NUMERIC NOT NULL,
  data        DATE NOT NULL,
  criado_por  UUID REFERENCES public.profiles(id),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 12. FINANCEIRO LANÇAMENTOS
CREATE TABLE IF NOT EXISTS public.financeiro_lancamentos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria  TEXT NOT NULL,
  descricao  TEXT,
  valor      NUMERIC NOT NULL,
  data       DATE NOT NULL,
  criado_por UUID REFERENCES public.profiles(id),
  criado_em  TIMESTAMPTZ DEFAULT NOW()
);

-- 13. RH OCORRÊNCIAS
CREATE TABLE IF NOT EXISTS public.rh_ocorrencias (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id  UUID NOT NULL REFERENCES public.colaboradores(id),
  tipo            TEXT NOT NULL CHECK (tipo IN ('falta', 'atraso', 'advertencia', 'atestado')),
  data            DATE NOT NULL,
  observacao      TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 14. METAS
CREATE TABLE IF NOT EXISTS public.metas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador   TEXT NOT NULL CHECK (indicador IN ('producao', 'faturamento', 'vendas')),
  periodo     TEXT NOT NULL,       -- formato: YYYY-MM
  valor_meta  NUMERIC NOT NULL,
  criado_em   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(indicador, periodo)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materiais              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.producao               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_movimentacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rh_ocorrencias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes          ENABLE ROW LEVEL SECURITY;

-- Política: usuário autenticado pode ler tudo
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','fornecedores','materiais','equipamentos','clientes',
    'colaboradores','entradas','producao','estoque_movimentacoes',
    'vendas','financeiro_lancamentos','rh_ocorrencias','metas','configuracoes'
  ]) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "leitura_autenticado" ON public.%I; '||
      'CREATE POLICY "leitura_autenticado" ON public.%I FOR SELECT USING (auth.role() = ''authenticated'');',
      t, t
    );
  END LOOP;
END $$;

-- Política: somente admin pode escrever
DO $$ DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'fornecedores','materiais','equipamentos','clientes',
    'colaboradores','entradas','producao','estoque_movimentacoes',
    'vendas','financeiro_lancamentos','rh_ocorrencias','metas','configuracoes'
  ]) LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS "escrita_admin" ON public.%I; '||
      'CREATE POLICY "escrita_admin" ON public.%I FOR ALL USING ('||
        'EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')'||
      ');',
      t, t
    );
  END LOOP;
END $$;

-- profiles: cada usuário pode ler/atualizar o próprio perfil
DROP POLICY IF EXISTS "perfil_proprio" ON public.profiles;
CREATE POLICY "perfil_proprio" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- ============================================================
-- DADOS INICIAIS (opcional — remova se não quiser seed)
-- ============================================================

-- Materiais comuns de reciclagem
INSERT INTO public.materiais (nome, unidade_medida) VALUES
  ('Papel/Papelão',   'kg'),
  ('Plástico PET',    'kg'),
  ('Plástico Rígido', 'kg'),
  ('Alumínio',        'kg'),
  ('Ferro/Aço',       'kg'),
  ('Vidro',           'kg'),
  ('Cobre',           'kg'),
  ('Eletrônico',      'kg')
ON CONFLICT DO NOTHING;

-- ============================================================
-- PARA TORNAR UM USUÁRIO ADMIN:
-- Após criar a conta pelo login, execute:
--
-- UPDATE public.profiles SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'seu@email.com');
--
-- ============================================================
