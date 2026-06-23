-- ============================================================
-- SGR Indaiatuba — Patch 9: Tabela de Equipamentos
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.equipamentos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        TEXT NOT NULL,
  frota       TEXT,
  descricao   TEXT,
  funcao      TEXT,
  capacidade  TEXT,
  status      TEXT NOT NULL DEFAULT 'operando' CHECK (status IN ('operando','restricao','parado')),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.equipamentos;
CREATE POLICY "leitura_autenticado" ON public.equipamentos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.equipamentos;
CREATE POLICY "escrita_admin" ON public.equipamentos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Inserir equipamentos iniciais
INSERT INTO public.equipamentos (nome, frota, descricao, funcao, capacidade, status) VALUES
  ('Balança Rodoviária',      NULL,        NULL,                                                          'Pesagem de veículos',              NULL, 'operando'),
  ('Retroescavadeira',        '54-U005',   NULL,                                                          'Movimentação dos materiais',       NULL, 'operando'),
  ('Esteira Transportadora',  '107-U011',  NULL,                                                          'Esteira e linha de triagem',       NULL, 'operando'),
  ('Prensa Vertical',         '111-U005',  'Marca: Recicle Já / Modelo: PRV351',                          'Prensa para plástico e papelão',   NULL, 'operando'),
  ('Prensa Vertical',         '111-U010',  'Tecmatisa',                                                   'Prensa para plástico e papelão',   NULL, 'operando'),
  ('Prensa Vertical',         '111-U012',  NULL,                                                          'Prensa para plástico e papelão',   NULL, 'operando'),
  ('Empilhadeira',            '007-U001',  'Marca: Hyundai / Modelo: HLF25-5 – Nº Série FU0210572',      'Movimentação e carregamentos',     NULL, 'operando'),
  ('Retorcedeira',            '122-U001',  NULL,                                                          'Fabricação de fitilhos',           NULL, 'operando');
