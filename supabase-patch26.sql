-- ============================================================
-- SGR Indaiatuba — Patch 26: Texto editável de "Próximos Passos"
-- no Plano de Expansão
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plano_expansao_config (
  id             INT PRIMARY KEY DEFAULT 1,
  proximos_passos TEXT,
  atualizado_em  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT plano_expansao_config_singleton CHECK (id = 1)
);

ALTER TABLE public.plano_expansao_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.plano_expansao_config;
CREATE POLICY "leitura_autenticado" ON public.plano_expansao_config
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.plano_expansao_config;
CREATE POLICY "escrita_admin" ON public.plano_expansao_config
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

INSERT INTO public.plano_expansao_config (id, proximos_passos)
VALUES (1, '3ª prensa prevista para 19/09/2026 — capacidade sobe para 72 t/mês · próxima semana: previsão de +5 Servente de Usina de Tratamento de Lixo')
ON CONFLICT (id) DO NOTHING;
