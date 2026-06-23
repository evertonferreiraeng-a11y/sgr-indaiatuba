-- ============================================================
-- SGR Indaiatuba — Patch 4: Colunas faltando em RH
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Colaboradores: colunas novas
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS cargo_id         UUID REFERENCES public.cargos(id);
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS fim_experiencia_1 DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS fim_experiencia_2 DATE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS ativo             BOOLEAN DEFAULT TRUE;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS telefone          TEXT;

-- Marca ativo=true para colaboradores existentes sem data de demissão
UPDATE public.colaboradores SET ativo = TRUE WHERE demissao IS NULL;

-- Colaborador avaliações: colunas novas (não existiam no patch original)
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS data_avaliacao DATE;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS periodo        TEXT;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS avaliador      TEXT;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS nota_media     NUMERIC;
ALTER TABLE public.colaborador_avaliacoes ADD COLUMN IF NOT EXISTS observacoes    TEXT;

-- Preenche data_avaliacao com data existente para registros antigos
UPDATE public.colaborador_avaliacoes SET data_avaliacao = data WHERE data_avaliacao IS NULL;

-- Tabela ocorrencias (faltas, atestados, advertências, elogios)
CREATE TABLE IF NOT EXISTS public.ocorrencias (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data           DATE NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('falta','atestado','advertencia','elogio','outro')),
  descricao      TEXT,
  criado_em      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.ocorrencias;
CREATE POLICY "leitura_autenticado" ON public.ocorrencias
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.ocorrencias;
CREATE POLICY "escrita_admin" ON public.ocorrencias
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
