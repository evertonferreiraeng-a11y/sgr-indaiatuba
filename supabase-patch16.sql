-- ============================================================
-- SGR Indaiatuba — Patch 16: Planos de Ação (cronograma, status,
-- responsáveis e estimativas de ganho/investimento)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.planos_acao (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo           TEXT NOT NULL,
  descricao        TEXT,
  categoria        TEXT,
  responsavel      TEXT,
  prioridade       TEXT NOT NULL DEFAULT 'media',     -- alta | media | baixa
  status           TEXT NOT NULL DEFAULT 'planejado',  -- planejado | em_andamento | concluido | cancelado
  data_inicio      DATE,
  data_fim         DATE,
  ganho_estimado   NUMERIC DEFAULT 0,
  investimento     NUMERIC DEFAULT 0,
  criado_em        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.planos_acao_etapas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id    UUID NOT NULL REFERENCES public.planos_acao(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  concluida   BOOLEAN DEFAULT FALSE,
  ordem       INT DEFAULT 0,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planos_acao        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_acao_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.planos_acao;
CREATE POLICY "leitura_autenticado" ON public.planos_acao
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.planos_acao;
CREATE POLICY "escrita_admin" ON public.planos_acao
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "leitura_autenticado" ON public.planos_acao_etapas;
CREATE POLICY "leitura_autenticado" ON public.planos_acao_etapas
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.planos_acao_etapas;
CREATE POLICY "escrita_admin" ON public.planos_acao_etapas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
