-- ============================================================
-- SGR Indaiatuba — Patch 18: Cenários dentro de um Plano de Ação
-- (permite criar vários cenários/alternativas dentro do mesmo plano,
-- cada um com seu próprio texto e financeiro)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.planos_acao_cenarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id         UUID NOT NULL REFERENCES public.planos_acao(id) ON DELETE CASCADE,
  titulo           TEXT NOT NULL,
  conteudo         TEXT,
  ganho_estimado   NUMERIC DEFAULT 0,
  investimento     NUMERIC DEFAULT 0,
  ordem            INT DEFAULT 0,
  criado_em        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.planos_acao_cenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.planos_acao_cenarios;
CREATE POLICY "leitura_autenticado" ON public.planos_acao_cenarios
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.planos_acao_cenarios;
CREATE POLICY "escrita_admin" ON public.planos_acao_cenarios
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
