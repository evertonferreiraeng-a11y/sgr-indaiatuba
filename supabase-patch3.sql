-- ============================================================
-- SGR Indaiatuba — Patch 3: Novos campos em Entradas
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS nota_fiscal           TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS motorista              TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS placa_veiculo          TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS pesagem_1              NUMERIC;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS pesagem_2              NUMERIC;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS impureza               NUMERIC DEFAULT 0;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS umidade                NUMERIC DEFAULT 0;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS peso_liquido           NUMERIC;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS peso_liquido_descontos NUMERIC;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS total_descontos        NUMERIC;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS rejeito_uvr            NUMERIC DEFAULT 0;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS transportadora         TEXT;
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS tipo_movimentacao      TEXT DEFAULT 'entrada';
ALTER TABLE public.entradas ADD COLUMN IF NOT EXISTS destino                TEXT;
