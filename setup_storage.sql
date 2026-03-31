-- 1. Create the 'products' bucket if it doesn't exist
-- Note: In Supabase, you can manage this via the dashboard or SQL if you have the right permissions.
-- This script assumes it's running in the SQL Editor with sufficient privileges.

INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for the 'products' bucket
-- These allow anyone to view/read images but only authenticated users (admins) to upload/edit/delete.

-- Policy: Allow Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Policy: Allow Authenticated Uploads
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Policy: Allow Authenticated Updates
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- Policy: Allow Authenticated Deletion
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );

-- Note: Ensure that the 'storage' schema is properly initialized.
-- Usually Supabase handles this, but strictly speaking, you need 'select' on storage.buckets for the API to work.
GRANT SELECT ON storage.buckets TO anon, authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
