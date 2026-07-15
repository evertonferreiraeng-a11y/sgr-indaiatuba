-- ============================================================
-- SGR Indaiatuba — Patch 11: Estudo de Cargas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Catálogo de tipos de carga (Reciclável, Orgânico, etc.), cadastrável
-- pela própria tela — sem exclusão física, apenas ativo/inativo, mesma
-- convenção usada em clientes/materiais.
CREATE TABLE IF NOT EXISTS public.tipos_carga (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      TEXT NOT NULL UNIQUE,
  ativo     BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.tipos_carga (nome) VALUES
  ('Reciclável'), ('Orgânico'), ('Rejeito'), ('Contaminado')
ON CONFLICT (nome) DO NOTHING;

-- Um "estudo de carga" = uma inspeção de um cliente + tipo de carga,
-- com fotos e observações, para decidir se a carga é boa ou não.
CREATE TABLE IF NOT EXISTS public.estudos_carga (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES public.clientes(id),
  tipo_carga_id UUID NOT NULL REFERENCES public.tipos_carga(id),
  data          DATE NOT NULL,
  avaliacao     TEXT NOT NULL CHECK (avaliacao IN ('aprovada', 'reprovada')),
  observacoes   TEXT,
  fotos         JSONB NOT NULL DEFAULT '[]',  -- [{ path, legenda }]
  criado_por    UUID REFERENCES public.profiles(id),
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tipos_carga   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estudos_carga ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.tipos_carga;
CREATE POLICY "leitura_autenticado" ON public.tipos_carga
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.tipos_carga;
CREATE POLICY "escrita_admin" ON public.tipos_carga
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

DROP POLICY IF EXISTS "leitura_autenticado" ON public.estudos_carga;
CREATE POLICY "leitura_autenticado" ON public.estudos_carga
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.estudos_carga;
CREATE POLICY "escrita_admin" ON public.estudos_carga
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- Storage: bucket para as fotos dos estudos de carga
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('cargas', 'cargas', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "cargas_leitura_publica" ON storage.objects;
CREATE POLICY "cargas_leitura_publica" ON storage.objects
  FOR SELECT USING (bucket_id = 'cargas');

DROP POLICY IF EXISTS "cargas_escrita_autenticado" ON storage.objects;
CREATE POLICY "cargas_escrita_autenticado" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cargas' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "cargas_delete_autenticado" ON storage.objects;
CREATE POLICY "cargas_delete_autenticado" ON storage.objects
  FOR DELETE USING (bucket_id = 'cargas' AND auth.role() = 'authenticated');
