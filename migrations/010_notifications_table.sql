-- =========================================================================
-- Migration: 010_notifications_table.sql
-- Description: Creates the notifications table for banner/offer notifications
-- with Row Level Security (RLS) policies.
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  image_url text,
  link_url text,
  material_category text,
  time_ago text DEFAULT 'Recently',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Allow public/unauthenticated (anon) and authenticated users to read Active notifications
DROP POLICY IF EXISTS "Public can view active notifications" ON public.notifications;
CREATE POLICY "Public can view active notifications"
  ON public.notifications
  FOR SELECT
  TO anon, authenticated
  USING (status = 'Active');

-- 2. Admin Policies: Allow service_role and admin users to manage all notifications
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications"
  ON public.notifications
  FOR ALL
  TO authenticated, service_role
  USING (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    auth.role() = 'service_role' OR 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Grant appropriate permissions
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT ALL ON public.notifications TO service_role;
