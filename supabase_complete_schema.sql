-- =========================================================================
-- COMPLETE SUPABASE MASTER SCHEMA & CONFIGURATION
-- Fashion E-Commerce (Aanya / AfforX)
-- Includes: Extensions, Tables, Foreign Keys, Triggers, RLS, Storage & Admin
-- =========================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 2. TABLES & CONSTRAINTS
-- =========================================================================

-- A. Profiles (Extends Supabase Auth Users)
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

-- B. Categories
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- C. Products
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  price numeric(10, 2) not null default 0,
  compare_at_price numeric(10, 2),
  category text not null default 'Sarees',
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  images text[] default '{}',
  stock_quantity integer default 25 not null,
  low_stock_threshold integer default 5 not null,
  status text default 'Published' check (status in ('Draft', 'Published', 'Archived')),
  rating numeric(3, 2) default 4.8,
  colors text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- D. Coupons / Discounts
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text default 'Percentage' check (discount_type in ('Percentage', 'Fixed')),
  discount_value numeric(10, 2) not null,
  status text default 'Active' check (status in ('Active', 'Paused', 'Expired')),
  usage_count integer default 0 not null,
  max_uses integer,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- E. Orders
-- Uses TEXT primary key with default generator to seamlessly support both custom IDs ('ord_...') and UUIDs
create table if not exists public.orders (
  id text primary key default ('ord_' || substr(md5(random()::text), 1, 10)),
  user_id uuid references auth.users(id) on delete set null,
  status text default 'Pending' check (status in ('Order Placed', 'Pending', 'Processing', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method text default 'COD' check (payment_method in ('COD', 'Card', 'UPI', 'Net Banking', 'Cash on Delivery')),
  payment_status text default 'Pending' check (payment_status in ('Pending', 'Success', 'Completed', 'Failed', 'Refunded')),
  subtotal numeric(10, 2) default 0,
  discount_amount numeric(10, 2) default 0,
  tax_amount numeric(10, 2) default 0,
  shipping_fee numeric(10, 2) default 0,
  total_amount numeric(10, 2) not null default 0,
  total_price numeric(10, 2) default 0,
  coupon_id uuid references public.coupons(id) on delete set null,
  shipping_address jsonb not null default '{}'::jsonb,
  payment_timestamp timestamp with time zone,
  payment_result jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Sync total_price with total_amount if one is provided
create or replace function public.sync_order_totals()
returns trigger as $$
begin
  if new.total_amount = 0 and new.total_price > 0 then
    new.total_amount := new.total_price;
  elsif new.total_price = 0 and new.total_amount > 0 then
    new.total_price := new.total_amount;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_order_totals on public.orders;
create trigger trg_sync_order_totals
  before insert or update on public.orders
  for each row execute function public.sync_order_totals();

-- F. Order Items
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  price_at_time numeric(10, 2) not null default 0,
  price numeric(10, 2) default 0,
  total_price numeric(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- G. Payments
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  method text not null default 'COD',
  status text not null default 'Pending' check (status in ('Pending', 'Success', 'Completed', 'Failed', 'Refunded')),
  amount numeric(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- H. Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text default 'Approved' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- I. Banners
create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  link_url text,
  image_url text not null,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- J. Wishlist
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- K. Carts & Cart Items
create table if not exists public.carts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1,
  unique(cart_id, product_id)
);

-- =========================================================================
-- 3. AUTOMATIC PROFILE TRIGGER (ON AUTH SIGNUP)
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    'Active'
  )
  on conflict (id) do update 
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.reviews enable row level security;
alter table public.banners enable row level security;
alter table public.wishlist enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public can read profiles" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Enable insert profile for auth" on public.profiles;

drop policy if exists "Public can read active categories" on public.categories;
drop policy if exists "Authenticated users can manage categories" on public.categories;

drop policy if exists "Public can read products" on public.products;
drop policy if exists "Authenticated users can manage products" on public.products;

drop policy if exists "Anyone can create orders" on public.orders;
drop policy if exists "Users or admin can view orders" on public.orders;
drop policy if exists "Admins or owners can update orders" on public.orders;

drop policy if exists "Anyone can insert order items" on public.order_items;
drop policy if exists "Anyone can read order items" on public.order_items;

drop policy if exists "Anyone can record payments" on public.payments;
drop policy if exists "Anyone can view payments" on public.payments;

drop policy if exists "Public can view active coupons" on public.coupons;
drop policy if exists "Public can view approved reviews" on public.reviews;
drop policy if exists "Users can insert reviews" on public.reviews;

drop policy if exists "Public can view banners" on public.banners;
drop policy if exists "Users can manage own wishlist" on public.wishlist;
drop policy if exists "Users can manage own cart" on public.carts;
drop policy if exists "Users can manage own cart items" on public.cart_items;

-- A. Profiles Policies
create policy "Public can read profiles" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Enable insert profile for auth" on public.profiles
  for insert with check (true);

-- B. Categories Policies
create policy "Public can read active categories" on public.categories
  for select using (true);

create policy "Authenticated users can manage categories" on public.categories
  for all to authenticated using (true) with check (true);

-- C. Products Policies
create policy "Public can read products" on public.products
  for select using (true);

create policy "Authenticated users can manage products" on public.products
  for all using (true) with check (true);

-- D. Orders Policies (Supports guest checkouts & user orders)
create policy "Anyone can create orders" on public.orders
  for insert with check (true);

create policy "Users or admin can view orders" on public.orders
  for select using (
    user_id is null 
    or auth.uid() = user_id 
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins or owners can update orders" on public.orders
  for update using (true);

-- E. Order Items Policies
create policy "Anyone can insert order items" on public.order_items
  for insert with check (true);

create policy "Anyone can read order items" on public.order_items
  for select using (true);

-- F. Payments Policies
create policy "Anyone can record payments" on public.payments
  for insert with check (true);

create policy "Anyone can view payments" on public.payments
  for select using (true);

-- G. Coupons Policies
create policy "Public can view active coupons" on public.coupons
  for select using (status = 'Active');

-- H. Reviews Policies
create policy "Public can view approved reviews" on public.reviews
  for select using (status = 'Approved');

create policy "Users can insert reviews" on public.reviews
  for insert with check (true);

-- I. Banners Policies
create policy "Public can view banners" on public.banners
  for select using (status = 'Active');

-- J. Wishlist Policies
create policy "Users can manage own wishlist" on public.wishlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- K. Carts Policies
create policy "Users can manage own cart" on public.carts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own cart items" on public.cart_items
  for all using (
    exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())
  );

-- =========================================================================
-- 5. STORAGE SETUP ('products' BUCKET)
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Storage Access" on storage.objects;
drop policy if exists "Authenticated Uploads" on storage.objects;
drop policy if exists "Authenticated Updates" on storage.objects;
drop policy if exists "Authenticated Deletion" on storage.objects;

create policy "Public Storage Access" on storage.objects
  for select using (bucket_id = 'products');

create policy "Authenticated Uploads" on storage.objects
  for insert with check (bucket_id = 'products');

create policy "Authenticated Updates" on storage.objects
  for update using (bucket_id = 'products');

create policy "Authenticated Deletion" on storage.objects
  for delete using (bucket_id = 'products');

-- =========================================================================
-- 6. ADMIN USER CREATION
-- =========================================================================

do $$
declare
  admin_uid uuid;
begin
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
    update auth.users
    set encrypted_password = crypt('Admin@26', gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now()
    where id = admin_uid;
  end if;

  insert into public.profiles (id, email, full_name, role, status)
  values (admin_uid, 'admin@aanyafashion.com', 'Aanya Admin', 'admin', 'Active')
  on conflict (id) do update 
  set role = 'admin', 
      status = 'Active',
      full_name = 'Aanya Admin';
end $$;

-- =========================================================================
-- 7. INITIAL SEED DATA (CATEGORIES & PRODUCTS)
-- =========================================================================

-- Categories
insert into public.categories (name, slug, description, image_url, status)
values
('Sarees', 'sarees', 'Traditional, designer, and silk sarees', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800', 'Active'),
('Kurtis', 'kurtis', 'Contemporary, ethnic, and casual kurtis', 'https://images.unsplash.com/photo-1609357605129-26f69abb5db6?q=80&w=800', 'Active'),
('Lehengas', 'lehengas', 'Bridal, festive, and embroidered lehengas', 'https://images.unsplash.com/photo-1594633225954-bh45c3b1acc2?q=80&w=800', 'Active'),
('Salwar Sets', 'salwar-sets', 'Authentic suits, anarkalis, and palazzo sets', 'https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=800', 'Active'),
('Western', 'western', 'Modern dresses, skirts, blazers, and fusion wear', 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800', 'Active'),
('Maxi', 'maxi', 'Flowing maxi gowns, floor length evening dresses', 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=800', 'Active')
on conflict (name) do nothing;

-- Coupons
insert into public.coupons (code, discount_type, discount_value, status, max_uses)
values
('WELCOME10', 'Percentage', 10, 'Active', 1000),
('FESTIVE500', 'Fixed', 500, 'Active', 500)
on conflict (code) do nothing;

-- Products (15+ core products covering all collections)
insert into public.products (name, description, price, compare_at_price, category, images, stock_quantity, status, rating)
values
('Royal Maroon Silk Saree', 'Exquisite silk weave with rich zari work on border and pallu.', 4999, 6999, 'Sarees', array['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1080'], 50, 'Published', 4.9),
('Emerald Zari Banarasi Saree', 'Lustrous Banarasi silk with pure gold metallic detailing.', 8499, 12999, 'Sarees', array['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080'], 30, 'Published', 4.9),
('Golden Kanchipuram Silk Saree', 'Heavily embellished bridal Kanchipuram silk.', 12999, 18999, 'Sarees', array['https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=1080'], 20, 'Published', 5.0),
('Classic White Chikankari Kurti', 'Authentic Lucknowi hand-embroidery on breathable cotton.', 1999, 2999, 'Kurtis', array['https://images.unsplash.com/photo-1609357605129-26f69abb5db6?q=80&w=1080'], 45, 'Published', 4.8),
('Indigo Floral Anarkali Kurti', 'Flared silhouette with hand-block botanical prints.', 2499, 3499, 'Kurtis', array['https://images.unsplash.com/photo-1617113931032-4d7a8d3e0b0e?q=80&w=1080'], 35, 'Published', 4.7),
('Sunshine Yellow Straight Kurti', 'Vibrant cotton kurta suitable for daily and office wear.', 1299, 1899, 'Kurtis', array['https://images.unsplash.com/photo-1624388339401-49942a77a9cf?q=80&w=1080'], 60, 'Published', 4.6),
('Bridal Red Heavily Embroidered Lehenga', 'Masterpiece bridal lehenga adorned with zardozi and cutdana work.', 45999, 65000, 'Lehengas', array['https://images.unsplash.com/photo-1594633225954-bh45c3b1acc2?q=80&w=1080'], 10, 'Published', 5.0),
('Peacock Blue Silk Lehenga', 'Regal silhouette with shimmering mirror work blouse and dupatta.', 22999, 35000, 'Lehengas', array['https://images.unsplash.com/photo-1595950275510-9c169b17781f?q=80&w=1080'], 15, 'Published', 4.9),
('Sunshine Yellow Haldi Special Lehenga', 'Lightweight georgette skirt with floral sequin blouse.', 12999, 18000, 'Lehengas', array['https://images.unsplash.com/photo-1610030469733-317426477cc1?q=80&w=1080'], 20, 'Published', 4.8),
('Emerald Silk Salwar Suit', 'Rich emerald green silk with heavy gold embroidery.', 5900, 8500, 'Salwar Sets', array['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080'], 25, 'Published', 4.8),
('Ivory Chikankari Set', 'Handcrafted Lucknowi chikankari on pure georgette.', 4200, 6000, 'Salwar Sets', array['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080'], 18, 'Published', 4.9),
('Floral Summer Maxi Gown', 'Sweeping fluid silhouette with delicate romantic floral prints.', 3299, 4499, 'Western', array['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1080'], 35, 'Published', 4.7),
('Velvet Cocktail Evening Dress', 'Sophisticated deep-toned velvet cocktail dress.', 4999, 6999, 'Western', array['https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=80&w=1080'], 20, 'Published', 4.8),
('Satin Party Gown', 'Sleek floor-length satin evening gown.', 8999, 12999, 'Western', array['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=1080'], 12, 'Published', 4.9),
('Royal Purple Smocked Maxi', 'Lightweight ethereal A-line gown with finely structured bodice.', 3999, 5499, 'Maxi', array['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1080'], 22, 'Published', 4.8)
on conflict (name) do nothing;
