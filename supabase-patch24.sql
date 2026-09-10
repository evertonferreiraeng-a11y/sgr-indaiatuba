-- ============================================================
-- SGR Indaiatuba — Patch 24: Plano de Expansão (Prensagem)
-- Histórico semanal de colaboradores, vagas e prensas em operação
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.plano_expansao_marcos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data                  DATE NOT NULL,
  colaboradores_ativos  INTEGER,
  vagas_abertas         INTEGER,
  prensas_operando      INTEGER,
  observacao            TEXT,
  criado_em             TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plano_expansao_marcos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.plano_expansao_marcos;
CREATE POLICY "leitura_autenticado" ON public.plano_expansao_marcos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.plano_expansao_marcos;
CREATE POLICY "escrita_admin" ON public.plano_expansao_marcos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Marcos iniciais já informados: início do plano (01/09) e atualização de hoje
INSERT INTO public.plano_expansao_marcos (data, colaboradores_ativos, vagas_abertas, prensas_operando, observacao)
VALUES
  ('2026-09-01', 5, 8, 2, 'Início do plano de expansão'),
  (CURRENT_DATE, 6, 7, 2, 'Atualização semanal');
