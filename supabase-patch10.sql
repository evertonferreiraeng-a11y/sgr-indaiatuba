-- ============================================================
-- SGR Indaiatuba — Patch 10: Notas Fiscais (fluxo de pedido de compra)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Recria do zero: a versão anterior desta tabela (com coluna "status" fixa
-- e numero_pedido obrigatório) foi substituída por um modelo de checklist,
-- onde cada etapa é uma data independente que pode ser marcada em qualquer
-- ordem — necessário para o caso em que o fornecedor emite a nota antes de
-- existir um pedido de compra no sistema.
DROP TABLE IF EXISTS public.notas_fiscais_pedidos;

CREATE TABLE public.notas_fiscais_pedidos (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido          TEXT,
  fornecedor_id          UUID NOT NULL REFERENCES public.fornecedores(id),
  descricao              TEXT,
  valor                  NUMERIC,
  numero_nf              TEXT,
  observacao             TEXT,
  cancelado              BOOLEAN NOT NULL DEFAULT FALSE,

  data_pedido            DATE,
  data_aprovacao         DATE,
  data_envio_fornecedor  DATE,
  data_nf_emitida        DATE,
  data_nf_recebida       DATE,
  data_lancamento        DATE,
  data_arquivamento      DATE,
  data_envio_financeiro  DATE,

  criado_por             UUID REFERENCES public.profiles(id),
  criado_em              TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notas_fiscais_pedidos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura_autenticado" ON public.notas_fiscais_pedidos;
CREATE POLICY "leitura_autenticado" ON public.notas_fiscais_pedidos
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "escrita_admin" ON public.notas_fiscais_pedidos;
CREATE POLICY "escrita_admin" ON public.notas_fiscais_pedidos
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ));
