-- ============================================================
-- SGR Indaiatuba — Patch 19: Anexo de arquivo por Cenário
-- (permite subir um arquivo, ex. Word/PDF, em cada cenário de um
-- plano de ação, para abrir com um clique em vez de colar texto)
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.planos_acao_cenarios
  ADD COLUMN IF NOT EXISTS arquivo_path TEXT,
  ADD COLUMN IF NOT EXISTS arquivo_nome TEXT;

-- ============================================================
-- Storage: bucket para os arquivos anexados aos cenários
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('planos-acao', 'planos-acao', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "planos_acao_leitura_publica" ON storage.objects;
CREATE POLICY "planos_acao_leitura_publica" ON storage.objects
  FOR SELECT USING (bucket_id = 'planos-acao');

DROP POLICY IF EXISTS "planos_acao_escrita_autenticado" ON storage.objects;
CREATE POLICY "planos_acao_escrita_autenticado" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'planos-acao' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "planos_acao_delete_autenticado" ON storage.objects;
CREATE POLICY "planos_acao_delete_autenticado" ON storage.objects
  FOR DELETE USING (bucket_id = 'planos-acao' AND auth.role() = 'authenticated');
