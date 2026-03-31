-- =========================================================================
-- ROBUST ADMIN USER SETUP SCRIPT (V3)
-- =========================================================================

-- Ensure pgcrypto is enabled for password hashing
create extension if not exists pgcrypto;

do $$
declare
  new_user_id uuid;
begin
  -- 1. Check if the user already exists in auth.users
  select id into new_user_id from auth.users where email = 'unaitech2025@gmail.com';

  if new_user_id is null then
    -- Create the user if they don't exist
    new_user_id := uuid_generate_v4();
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
      new_user_id,
      'authenticated',
      'authenticated',
      'unaitech2025@gmail.com',
      crypt('Unaitech@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"AfforX Admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  else
    -- Update existing user's password just in case
    update auth.users
    set encrypted_password = crypt('Unaitech@1234', gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now()
    where id = new_user_id;
  end if;

  -- 2. Ensure the profile exists and has the admin role
  insert into public.profiles (id, email, full_name, role, status)
  values (new_user_id, 'unaitech2025@gmail.com', 'AfforX Admin', 'admin', 'Active')
  on conflict (id) do update 
  set role = 'admin', 
      status = 'Active';

end $$;
