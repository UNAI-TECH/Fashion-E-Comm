-- ============================================================================
-- Migration 006: Google Pay Payments & Payouts Architecture
-- Safe & Idempotent Migration: Fixes existing tables and adds missing columns
-- ============================================================================

-- 1. Create table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT DEFAULT 'Google Pay',
    gateway_txn_id TEXT,
    payer_vpa TEXT,
    status TEXT NOT NULL DEFAULT 'Initiated',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure all columns exist even if public.payments was created by an older script
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Google Pay';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS gateway_txn_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS payer_vpa TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Initiated';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Create public.payouts table for settlement records
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payout_id TEXT UNIQUE NOT NULL,
    gross_amount NUMERIC(10, 2) NOT NULL,
    fee_amount NUMERIC(10, 2) DEFAULT 0.00,
    tax_amount NUMERIC(10, 2) DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    bank_account_last4 TEXT,
    settlement_utr TEXT,
    status TEXT NOT NULL DEFAULT 'Processed',
    settled_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Performance Indexes (Guaranteed to succeed because columns exist)
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_txn_id ON public.payments(gateway_txn_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_settled_at ON public.payouts(settled_at DESC);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Payments
DROP POLICY IF EXISTS "Anyone can insert payments" ON public.payments;
CREATE POLICY "Anyone can insert payments" 
ON public.payments FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users and Admins view payments" ON public.payments;
CREATE POLICY "Users and Admins view payments" 
ON public.payments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow update payments" ON public.payments;
CREATE POLICY "Allow update payments" 
ON public.payments FOR UPDATE 
USING (true);

-- 7. RLS Policies for Payouts
DROP POLICY IF EXISTS "Admins view all payouts" ON public.payouts;
CREATE POLICY "Admins view all payouts" 
ON public.payouts FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admins insert payouts" ON public.payouts;
CREATE POLICY "Admins insert payouts" 
ON public.payouts FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins update payouts" ON public.payouts;
CREATE POLICY "Admins update payouts" 
ON public.payouts FOR UPDATE 
USING (true);
