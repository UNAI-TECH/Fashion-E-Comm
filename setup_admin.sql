-- =========================================================================
-- ROBUST ADMIN USER SETUP SCRIPT (FOR SUPABASE SQL EDITOR)
-- =========================================================================
-- Admin Credentials: admin@aanyafashion.com / Admin@26

-- 1. Ensure required extensions exist
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Ensure public.profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  phone text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  status text default 'Active' check (status in ('Active', 'Blocked')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create or Update Admin User & Assign Admin Role
do $$
declare
  admin_uid uuid;
begin
  -- Check if user already exists in auth.users
  select id into admin_uid from auth.users where email = 'admin@aanyafashion.com';

  if admin_uid is null then
    admin_uid := gen_random_uuid();
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      admin_uid,
      'authenticated',
      'authenticated',
      'admin@aanyafashion.com',
      crypt('Admin@26', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Aanya Admin","role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    -- Update existing user password & confirm email
    update auth.users
    set encrypted_password = crypt('Admin@26', gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now(),
        raw_user_meta_data = '{"full_name":"Aanya Admin","role":"admin"}'
    where id = admin_uid;
  end if;

  -- Upsert admin profile
  insert into public.profiles (id, email, full_name, role, status)
  values (admin_uid, 'admin@aanyafashion.com', 'Aanya Admin', 'admin', 'Active')
  on conflict (id) do update 
  set role = 'admin', 
      status = 'Active',
      full_name = 'Aanya Admin';

end $$;
