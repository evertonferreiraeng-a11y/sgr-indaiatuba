-- ============================================================
-- SGR Indaiatuba — Patch 27: Passivo e Rejeito mensais no
-- Plano de Expansão (para compor o Processamento Total)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plano_expansao_ajustes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes            DATE NOT NULL,
  passivo_ton    NUMERIC DEFAULT 0,
  rejeito_ton    NUMERIC DEFAULT 0,
  observacao     TEXT,
  atualizado_em  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (mes)
);

ALTER TABLE public.plano_expansao_ajustes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.plano_expansao_ajustes;
CREATE POLICY "leitura_autenticado" ON public.plano_expansao_ajustes
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.plano_expansao_ajustes;
CREATE POLICY "escrita_admin" ON public.plano_expansao_ajustes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
