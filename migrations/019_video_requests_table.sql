-- ============================================================================
-- Migration 019: Create video_requests table for Live Video Demo Appointments
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.video_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT,
    product_name TEXT NOT NULL,
    product_image TEXT,
    product_price NUMERIC(10,2),
    customer_name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    scheduled_time TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_video_requests_status ON public.video_requests(status);
CREATE INDEX IF NOT EXISTS idx_video_requests_created_at ON public.video_requests(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.video_requests ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (guests and logged-in customers) can insert video requests
DROP POLICY IF EXISTS "Anyone can insert video requests" ON public.video_requests;
CREATE POLICY "Anyone can insert video requests" 
ON public.video_requests FOR INSERT 
WITH CHECK (true);

-- 2. Anyone / Admins can read video requests
DROP POLICY IF EXISTS "Anyone can view video requests" ON public.video_requests;
CREATE POLICY "Anyone can view video requests" 
ON public.video_requests FOR SELECT 
USING (true);

-- 3. Admins can update video request status (accept, reject)
DROP POLICY IF EXISTS "Anyone can update video requests" ON public.video_requests;
CREATE POLICY "Anyone can update video requests" 
ON public.video_requests FOR UPDATE 
USING (true);

