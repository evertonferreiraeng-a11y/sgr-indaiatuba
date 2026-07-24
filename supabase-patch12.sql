-- ============================================================
-- SGR Indaiatuba — Patch 12: Destino de Cargas + atualização da
-- lista de clientes do Estudo de Cargas
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Matriz cliente x tipo de carga -> destino (ex: "Reciclagem X - Campinas").
CREATE TABLE IF NOT EXISTS public.destinos_carga (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    UUID NOT NULL REFERENCES public.clientes(id),
  tipo_carga_id UUID NOT NULL REFERENCES public.tipos_carga(id),
  destino       TEXT,
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (cliente_id, tipo_carga_id)
);

ALTER TABLE public.destinos_carga ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.destinos_carga;
CREATE POLICY "leitura_autenticado" ON public.destinos_carga
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.destinos_carga;
CREATE POLICY "escrita_admin" ON public.destinos_carga
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- ============================================================
-- Atualização da lista de clientes (tela Estudo de Cargas)
-- ============================================================

-- Desativa os clientes de amostra/teste que estavam cadastrados
-- (mantém o histórico em outras telas intacto — apenas somem das listas).
UPDATE public.clientes SET ativo = FALSE WHERE nome IN (
  'Cartonifício Valinhos',
  'Deposito Ferro Velho Ouro Preto',
  'Eco Sucatas (t)',
  'Jonasi (t)',
  'MAX METAIS COMERCIO DE SUCATAS LTDA',
  'Oliveira Sucatas (t)',
  'Pallet Comercio e Embalagens',
  'RFR Ind. Logistica',
  'Rodoanel Ambiental (t)',
  'teste',
  'Valorize Reciclagem'
);

-- Insere os novos clientes, um por um (evita duplicar se o script
-- for executado mais de uma vez).
DO $$ DECLARE
  nomes TEXT[] := ARRAY[
    'AEROPORTO INTERNACIONAL VIRACOPOS',
    'DIVERSOS',
    'HNK BR INDUSTRIA',
    'LOJAS RENNER S.A',
    'SUB SHOPPING CENTER - SUB POLL',
    'QUIMICA AMPARO LTDA',
    'SIEMENS ENERGY DO BRASIL LTDA',
    'RICH DO BRASIL LTDA',
    'FITESA NAOTECIDOS S.A',
    'GARDNER DENVER BRASIL INDUSTRI',
    'BASF S.A',
    'CHR HANSEN IND E COM LTDA',
    'CLUBE DE CAMPO VALINHOS',
    'CARGILL AGRICOLA S.A.',
    'TW ESPUMAS',
    'NCD BRASIL INDUSTRIA E COMERCI',
    'GL FOODS WORLDWIDE LTDA',
    'PEPSICO DO BRAZIL LTDA',
    'PLASTIPRENE PLASTICOS',
    'JHSF ADMINISTRADORA DO CATARIN',
    'SAINT GOBAIN',
    'CENTRO DE DISTRIBUICAO 654',
    'TMD FRICTION DO BRASIL S.A.',
    'FUNDACAO CPQD CENTRO DE PESQUI'
  ];
  n TEXT;
BEGIN
  FOREACH n IN ARRAY nomes LOOP
    IF NOT EXISTS (SELECT 1 FROM public.clientes WHERE nome = n) THEN
      INSERT INTO public.clientes (nome) VALUES (n);
    END IF;
  END LOOP;
END $$;
