-- ==========================================================
-- MIGRACIÓN: PARTICIPACIONES POR PREMIO Y TICKETS ADICIONALES
-- Proyecto: DaleyGana (xstgyummodmjegruvofg)
-- ==========================================================

-- 1. TABLA PRIZE_PARTICIPATIONS
CREATE TABLE IF NOT EXISTS public.prize_participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    raffle_id UUID NOT NULL REFERENCES public.raffles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    base_participation INTEGER NOT NULL DEFAULT 1,
    additional_tickets INTEGER NOT NULL DEFAULT 0,
    total_participations INTEGER GENERATED ALWAYS AS (base_participation + additional_tickets) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_participant_raffle UNIQUE (participant_id, raffle_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_prize_participations_participant ON public.prize_participations(participant_id);
CREATE INDEX IF NOT EXISTS idx_prize_participations_raffle ON public.prize_participations(raffle_id);
CREATE INDEX IF NOT EXISTS idx_prize_participations_campaign ON public.prize_participations(campaign_id);

-- 2. TABLA ORDER_ITEMS (Para items del carrito de tickets adicionales)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    raffle_id UUID REFERENCES public.raffles(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_raffle ON public.order_items(raffle_id);

-- 3. COLUMNAS ADICIONALES
-- Precio por ticket configurable en raffles (por defecto S/ 1.00)
ALTER TABLE public.raffles ADD COLUMN IF NOT EXISTS ticket_price NUMERIC(10,2) NOT NULL DEFAULT 1.00;

-- Tipo de orden y raffle_id en orders si aplica
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) NOT NULL DEFAULT 'base';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS raffle_id UUID REFERENCES public.raffles(id) ON DELETE SET NULL;

-- Permitir pack_id nullable en orders si es compra por carrito de chances
ALTER TABLE public.orders ALTER COLUMN pack_id DROP NOT NULL;

-- Asociar tickets a raffle específico si aplica
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS raffle_id UUID REFERENCES public.raffles(id) ON DELETE SET NULL;

-- 4. TABLA CAMPAIGN_REGISTRATIONS (Si no existía)
CREATE TABLE IF NOT EXISTS public.campaign_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL REFERENCES public.participants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_campaign_participant UNIQUE (campaign_id, participant_id)
);

-- 5. POLÍTICAS RLS (Habilitar lectura pública o para anon / service role)
ALTER TABLE public.prize_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_registrations ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a todos (para consulta pública o autenticada)
DROP POLICY IF EXISTS "Allow public read prize_participations" ON public.prize_participations;
CREATE POLICY "Allow public read prize_participations" ON public.prize_participations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on prize_participations" ON public.prize_participations;
CREATE POLICY "Allow service role all on prize_participations" ON public.prize_participations FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read order_items" ON public.order_items;
CREATE POLICY "Allow public read order_items" ON public.order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on order_items" ON public.order_items;
CREATE POLICY "Allow service role all on order_items" ON public.order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public read campaign_registrations" ON public.campaign_registrations;
CREATE POLICY "Allow public read campaign_registrations" ON public.campaign_registrations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow service role all on campaign_registrations" ON public.campaign_registrations;
CREATE POLICY "Allow service role all on campaign_registrations" ON public.campaign_registrations FOR ALL USING (true);

-- Notificar recarga de caché de esquema
NOTIFY pgrst, 'reload schema';
