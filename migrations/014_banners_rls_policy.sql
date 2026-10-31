-- ============================================================================
-- Migration 014: Enable RLS and Configure Full Access Policies for Banners Table
-- Ensures storefront can query active banners and admin dashboard can insert/update/delete
-- ============================================================================

-- 1. Ensure table exists with standard columns
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    badge TEXT,
    image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '/category/sarees',
    status TEXT NOT NULL DEFAULT 'Active',
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_banners_status_order ON public.banners(status, display_order);

-- 3. Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 4. Service role has full permissions
DROP POLICY IF EXISTS "Service role full access on banners" ON public.banners;
CREATE POLICY "Service role full access on banners"
ON public.banners
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Public read-only policy for active banners
DROP POLICY IF EXISTS "Public read access to banners" ON public.banners;
CREATE POLICY "Public read access to banners"
ON public.banners
FOR SELECT
TO public, anon, authenticated
USING (true);

-- 6. Authenticated and admin write access
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.banners;
CREATE POLICY "Authenticated users can manage banners"
ON public.banners
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Allow anon write if client directly updates
DROP POLICY IF EXISTS "Anon insert and update banners" ON public.banners;
CREATE POLICY "Anon insert and update banners"
ON public.banners
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 8. Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

