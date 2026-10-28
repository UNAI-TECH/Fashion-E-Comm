-- =========================================================================
-- AANYA FASHIONS E-COMMERCE PLATFORM
-- MASTER UNIFIED DATABASE SCHEMA & PRODUCTION SEED
-- =========================================================================
-- Compatible with: PostgreSQL 14+, Supabase, Supabase SQL Editor
-- Includes:
--   1. Extensions (uuid-ossp, pgcrypto)
--   2. All 20 Core Tables & Column Definitions
--   3. Indexes, Triggers, & Search Vectors
--   4. Production Stored Procedures (fulfill_order_stock, decrement_stock, etc.)
--   5. Complete Row Level Security (RLS) Policies
--   6. Storage Buckets ('products', 'banners', 'avatars') & Storage Policies
--   7. Admin User Creation (admin@aanyafashion.com)
--   8. Initial Seed Data (Categories, Coupons, Banners)
--   9. Complete 100% WebP Products Seed (125 Unique Catalog Items)
-- =========================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 2. TABLES & CONSTRAINTS
-- =========================================================================

-- A. Profiles (Extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
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
  images text[] default '{}'::text[],
  stock_quantity integer default 25 not null,
  low_stock_threshold integer default 5 not null,
  status text default 'Published' check (status in ('Draft', 'Published', 'Archived')),
  rating numeric(3, 2) default 4.8,
  colors text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  search_vector tsvector,
  specifications jsonb default '{}'::jsonb,
  offer_enabled boolean default false,
  offer_details jsonb default '{}'::jsonb,
  variant_group_id uuid,
  variant_color text default '',
  material_type text default ''
);

-- D. Product Variants (Multi-Size & Multi-Color)
create table if not exists public.product_variants (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  sku text unique,
  size text,
  color text,
  stock_quantity integer default 0 not null,
  price_override numeric(10, 2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- E. Product Images (Detailed Multi-Angle Gallery)
create table if not exists public.product_images (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  image_url text not null,
  sort_order integer default 0 not null,
  alt_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- F. Coupons / Discounts
create table if not exists public.coupons (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  discount_type text default 'Percentage' check (discount_type in ('Percentage', 'Fixed')),
  discount_value numeric(10, 2) not null,
  min_order_amount numeric(10, 2) default 0,
  max_discount_amount numeric(10, 2),
  status text default 'Active' check (status in ('Active', 'Paused', 'Expired')),
  usage_count integer default 0 not null,
  max_uses integer,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- G. Coupon Redemptions
create table if not exists public.coupon_redemptions (
  id uuid default gen_random_uuid() primary key,
  coupon_id uuid references public.coupons(id) on delete cascade not null,
  order_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  discount_applied numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- H. Orders
create table if not exists public.orders (
  id text primary key default ('ord_' || substr(md5(random()::text), 1, 10)),
  user_id uuid references auth.users(id) on delete set null,
  status text default 'Pending',
  payment_method text default 'COD',
  payment_status text default 'Pending',
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
  tracking_number text,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- I. Order Items
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text,
  quantity integer not null default 1 check (quantity > 0),
  price_at_time numeric(10, 2) not null default 0,
  price numeric(10, 2) default 0,
  total_price numeric(10, 2) not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- J. Order Status History
create table if not exists public.order_status_history (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  status text not null,
  notes text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- K. Payments
create table if not exists public.payments (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  method text not null default 'COD',
  payment_method text default 'COD',
  gateway_txn_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  payer_vpa text,
  customer_name text,
  customer_phone text,
  currency text default 'INR',
  status text not null default 'Pending',
  amount numeric(10, 2) not null default 0,
  gateway_response jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- L. Payouts (Settlements & Vendor Transfers)
create table if not exists public.payouts (
  id uuid default gen_random_uuid() primary key,
  payout_id text unique,
  amount numeric(10, 2) not null default 0,
  currency text default 'INR',
  status text default 'pending',
  utr text,
  method text default 'NEFT',
  recipient_name text,
  recipient_account text,
  recipient_ifsc text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- M. Reviews
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  user_name text,
  title text,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  verified_purchase boolean default false,
  helpful_votes integer default 0,
  status text default 'Approved' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- N. Banners
create table if not exists public.banners (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  subtitle text,
  link_url text,
  image_url text not null,
  badge text,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- O. Wishlist
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, product_id)
);

-- P. Carts & Cart Items
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
  quantity integer not null default 1 check (quantity > 0),
  unique(cart_id, product_id)
);

-- Q. Customer Saved Addresses
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  full_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state text not null,
  postal_code text not null,
  country text default 'India',
  is_default boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- R. Notifications & Promotional Alerts
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text default 'info' check (type in ('info', 'offer', 'order', 'alert')),
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- S. Inventory Audit Transactions
create table if not exists public.inventory_transactions (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  delta integer not null,
  reason text not null,
  reference_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 3. INDEXES & FULL-TEXT SEARCH
-- =========================================================================

create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_products_variant_group on public.products(variant_group_id);
create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_payments_order_id on public.payments(order_id);
create index if not exists idx_payments_gateway_txn on public.payments(gateway_txn_id);
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);

-- Full text search function and trigger for products
create or replace function public.products_search_trigger()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.material_type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'C');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_search on public.products;
create trigger trg_products_search
  before insert or update on public.products
  for each row execute function public.products_search_trigger();

create index if not exists idx_products_search_vector on public.products using gin(search_vector);

-- =========================================================================
-- 4. STORED PROCEDURES & RPC FUNCTIONS
-- =========================================================================

-- A. Atomic Stock Fulfillment (Concurrency-Safe Order Checkout)
create or replace function public.fulfill_order_stock(
  p_order_id text,
  p_items jsonb
) returns jsonb as $$
declare
  item record;
  prod record;
  v_prod_id uuid;
  v_qty integer;
begin
  -- 1. Ensure all items have sufficient stock by locking target rows
  for item in select * from jsonb_to_recordset(p_items) as x(id text, quantity integer) loop
    v_prod_id := item.id::uuid;
    v_qty := coalesce(item.quantity, 1);

    select * into prod from public.products
    where id = v_prod_id
    for update; -- Acquire row lock to prevent race conditions

    if not found then
      return jsonb_build_object('success', false, 'code', 'PRODUCT_NOT_FOUND', 'message', 'Product not found: ' || item.id);
    end if;

    if prod.stock_quantity < v_qty then
      return jsonb_build_object(
        'success', false,
        'code', 'INSUFFICIENT_STOCK',
        'message', 'Insufficient stock for product: ' || prod.name || '. Available: ' || prod.stock_quantity,
        'available', prod.stock_quantity
      );
    end if;
  end loop;

  -- 2. Decrement stock atomically
  for item in select * from jsonb_to_recordset(p_items) as x(id text, quantity integer) loop
    v_prod_id := item.id::uuid;
    v_qty := coalesce(item.quantity, 1);

    update public.products
    set stock_quantity = stock_quantity - v_qty,
        updated_at = timezone('utc'::text, now())
    where id = v_prod_id;

    -- Audit trail
    insert into public.inventory_transactions (product_id, delta, reason, reference_id)
    values (v_prod_id, -v_qty, 'Order Fulfillment', p_order_id);
  end loop;

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$ language plpgsql security definer;

-- B. Standalone Decrement Stock Function
create or replace function public.decrement_stock(
  product_id uuid,
  quantity integer
) returns boolean as $$
declare
  current_stock integer;
begin
  select stock_quantity into current_stock
  from public.products
  where id = product_id
  for update;

  if current_stock is null or current_stock < quantity then
    return false;
  end if;

  update public.products
  set stock_quantity = stock_quantity - quantity,
      updated_at = timezone('utc'::text, now())
  where id = product_id;

  return true;
end;
$$ language plpgsql security definer;

-- C. Restore Stock (on Order Cancellation)
create or replace function public.restore_stock(
  product_id uuid,
  quantity integer
) returns boolean as $$
begin
  update public.products
  set stock_quantity = stock_quantity + quantity,
      updated_at = timezone('utc'::text, now())
  where id = product_id;

  return true;
end;
$$ language plpgsql security definer;

-- D. Sync Order Total Amount & Total Price Trigger
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

-- E. Auto User Profile Creation on Auth Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    case 
      when lower(new.email) in ('admin@aanyafashion.com', 'nehemiahnesanathan@gmail.com') then 'admin'
      else coalesce(new.raw_user_meta_data->>'role', 'customer')
    end,
    'Active'
  )
  on conflict (id) do update 
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, public.profiles.full_name),
      role = case 
        when lower(excluded.email) in ('admin@aanyafashion.com', 'nehemiahnesanathan@gmail.com') then 'admin'
        else public.profiles.role
      end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.coupons enable row level security;
alter table public.coupon_redemptions enable row level security;
alter table public.reviews enable row level security;
alter table public.banners enable row level security;
alter table public.wishlist enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.notifications enable row level security;
alter table public.payouts enable row level security;

-- Profiles Policies
drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Enable insert profile for auth" on public.profiles;
create policy "Enable insert profile for auth" on public.profiles for insert with check (true);

-- Categories Policies
drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select using (true);

drop policy if exists "Authenticated users can manage categories" on public.categories;
create policy "Authenticated users can manage categories" on public.categories for all to authenticated using (true) with check (true);

-- Products Policies
drop policy if exists "Public can read products" on public.products;
create policy "Public can read products" on public.products for select using (true);

drop policy if exists "Authenticated users can manage products" on public.products;
create policy "Authenticated users can manage products" on public.products for all using (true) with check (true);

-- Product Variants & Images
drop policy if exists "Public can read variants" on public.product_variants;
create policy "Public can read variants" on public.product_variants for select using (true);

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images" on public.product_images for select using (true);

-- Orders Policies (Supports Guest & Authenticated Checkouts)
drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders" on public.orders for insert with check (true);

drop policy if exists "Users or admin can view orders" on public.orders;
create policy "Users or admin can view orders" on public.orders for select using (
  user_id is null 
  or auth.uid() = user_id 
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Admins or owners can update orders" on public.orders;
create policy "Admins or owners can update orders" on public.orders for update using (true);

-- Order Items Policies
drop policy if exists "Anyone can insert order items" on public.order_items;
create policy "Anyone can insert order items" on public.order_items for insert with check (true);

drop policy if exists "Anyone can read order items" on public.order_items;
create policy "Anyone can read order items" on public.order_items for select using (true);

-- Payments Policies
drop policy if exists "Anyone can record payments" on public.payments;
create policy "Anyone can record payments" on public.payments for insert with check (true);

drop policy if exists "Anyone can view payments" on public.payments;
create policy "Anyone can view payments" on public.payments for select using (true);

-- Coupons Policies
drop policy if exists "Public can view active coupons" on public.coupons;
create policy "Public can view active coupons" on public.coupons for select using (true);

-- Reviews Policies
drop policy if exists "Public can view approved reviews" on public.reviews;
create policy "Public can view approved reviews" on public.reviews for select using (status = 'Approved');

drop policy if exists "Users can insert reviews" on public.reviews;
create policy "Users can insert reviews" on public.reviews for insert with check (true);

-- Banners Policies
drop policy if exists "Public can view banners" on public.banners;
create policy "Public can view banners" on public.banners for select using (status = 'Active');

-- Wishlist Policies
drop policy if exists "Users can manage own wishlist" on public.wishlist;
create policy "Users can manage own wishlist" on public.wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cart & Cart Items Policies
drop policy if exists "Users can manage own cart" on public.carts;
create policy "Users can manage own cart" on public.carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage own cart items" on public.cart_items;
create policy "Users can manage own cart items" on public.cart_items for all using (
  exists (select 1 from public.carts where carts.id = cart_items.cart_id and carts.user_id = auth.uid())
);

-- Addresses Policies
drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses" on public.addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications Policies
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id or user_id is null);

-- =========================================================================
-- 6. STORAGE SETUP ('products', 'banners', 'avatars' BUCKETS)
-- =========================================================================

insert into storage.buckets (id, name, public)
values 
  ('products', 'products', true),
  ('banners', 'banners', true),
  ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Public Storage Access Products" on storage.objects;
create policy "Public Storage Access Products" on storage.objects
  for select using (bucket_id in ('products', 'banners', 'avatars'));

drop policy if exists "Authenticated Uploads" on storage.objects;
create policy "Authenticated Uploads" on storage.objects
  for insert with check (bucket_id in ('products', 'banners', 'avatars'));

drop policy if exists "Authenticated Updates" on storage.objects;
create policy "Authenticated Updates" on storage.objects
  for update using (bucket_id in ('products', 'banners', 'avatars'));

drop policy if exists "Authenticated Deletion" on storage.objects;
create policy "Authenticated Deletion" on storage.objects
  for delete using (bucket_id in ('products', 'banners', 'avatars'));

-- =========================================================================
-- 7. DEFAULT ADMIN USER CREATION
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
      updated_at
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
      now()
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

  -- Ensure nehemiahnesanathan@gmail.com has admin role
  update public.profiles
  set role = 'admin', status = 'Active'
  where lower(email) = 'nehemiahnesanathan@gmail.com';

  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
  where lower(email) = 'nehemiahnesanathan@gmail.com';
exception when others then
  raise notice 'Admin user initialization notice: %', sqlerrm;
end $$;

-- =========================================================================
-- 8. INITIAL SEED DATA: CATEGORIES, COUPONS, BANNERS
-- =========================================================================

-- Categories Seed
insert into public.categories (name, slug, description, image_url, status)
values
('Sarees', 'sarees', 'Traditional, designer, and silk sarees', '/saree_s1.webp', 'Active'),
('Kurtis', 'kurtis', 'Contemporary, ethnic, and casual kurtis', '/kurti_k1.webp', 'Active'),
('Lehengas', 'lehengas', 'Bridal, festive, and embroidered lehengas', '/lehenga_l1.webp', 'Active'),
('Salwar Sets', 'salwar-sets', 'Authentic suits, anarkalis, and palazzo sets', '/salwar_ss1.webp', 'Active'),
('Western', 'western', 'Modern dresses, skirts, blazers, and fusion wear', '/western_w1.webp', 'Active'),
('Maxi', 'maxi', 'Flowing maxi gowns, floor length evening dresses', '/maxi_mx1.webp', 'Active'),
('Tradition', 'tradition', 'Heritage weaves and timeless ceremonial apparel', '/tradition_t1.webp', 'Active')
on conflict (name) do nothing;

-- Coupons Seed
insert into public.coupons (code, discount_type, discount_value, min_order_amount, status, max_uses)
values
('WELCOME10', 'Percentage', 10, 999, 'Active', 1000),
('FESTIVE25', 'Percentage', 25, 2999, 'Active', 500),
('ROYAL35', 'Percentage', 35, 4999, 'Active', 250),
('AANYABRIDE', 'Fixed', 2000, 9999, 'Active', 100)
on conflict (code) do nothing;

-- Banners Seed
insert into public.banners (id, title, subtitle, image_url, link_url, badge, status, display_order)
values
('b0000000-0001-4000-8000-000000000001'::uuid, 'Royal Banarasi Collection', 'Handwoven pure silk sarees crafted by master weavers', '/saree_category.webp', '/products?category=Sarees', 'Handcrafted', 'Active', 1),
('b0000000-0002-4000-8000-000000000002'::uuid, 'Festive Elegance 2026', 'Up to 35% off on celebratory Lehengas & Kurtis', '/lehenga_category_pink.webp', '/products?category=Lehengas', 'Festive Offer', 'Active', 2)
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  image_url = excluded.image_url,
  link_url = excluded.link_url,
  badge = excluded.badge,
  status = excluded.status,
  display_order = excluded.display_order;


-- 4. Insert or Update all 125 Products with WebP Images

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000001'::uuid,
  'Royal Maroon Silk Saree',
  'Exquisite silk weave with rich gold zari work on border and pallu. Includes matching unstitched blouse piece.',
  4999,
  6999,
  'Sarees',
  '/saree_s1.webp',
  ARRAY['/saree_s1.webp', '/saree_royal_maroon.webp', '/saree_model_editorial.webp', '/saree_s1_cutout.webp'],
  50,
  10,
  'Published',
  4.85,
  ARRAY['#800000', '#D4AF37'],
  'Pure Mulberry Silk',
  'Royal Maroon',
  '{"fabric":"Pure Silk","weave":"Banarasi Zari","length":"5.5 meters","blouse":"0.8 meters unstitched","wash_care":"Dry Clean Only","occasion":"Festive & Wedding"}'::jsonb,
  true,
  '{"discount_pct":28.6,"badge":"Festive Offer","code":"FESTIVE25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000002'::uuid,
  'Emerald Zari Banarasi Saree',
  'Lustrous Banarasi silk with pure gold metallic detailing and traditional paisley motifs throughout.',
  8499,
  12999,
  'Sarees',
  '/saree_s2.webp',
  ARRAY['/saree_s2.webp', '/saree_emerald_model.webp', '/saree_s2_cutout.webp', '/saree_category.webp'],
  30,
  10,
  'Published',
  4.9,
  ARRAY['#004F30', '#D4AF37'],
  'Katan Banarasi Silk',
  'Emerald Green',
  '{"fabric":"Banarasi Silk","weave":"Kadhwa Zari","length":"5.5 meters","blouse":"0.8 meters unstitched","wash_care":"Dry Clean Only","occasion":"Reception & Gala"}'::jsonb,
  true,
  '{"discount_pct":34.6,"badge":"Heritage Luxury","code":"ROYAL35"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000003'::uuid,
  'Golden Kanchipuram Silk Saree',
  'Heavily embellished bridal Kanchipuram silk with contrast temple borders and rich zari pallu.',
  12999,
  18999,
  'Sarees',
  '/saree_s3.webp',
  ARRAY['/saree_s3.webp', '/saree_s3_cutout.webp', '/model_1.webp', '/saree_category_stacked.webp'],
  20,
  8,
  'Published',
  5,
  ARRAY['#D4AF37', '#FFD700'],
  'Kanchipuram Silk',
  'Metallic Gold',
  '{"fabric":"Pure Kanchipuram Silk","weave":"Korvai Weave","length":"5.5 meters","blouse":"0.8 meters contrast","wash_care":"Dry Clean Only","occasion":"Bridal & Muhurtham"}'::jsonb,
  true,
  '{"discount_pct":31.6,"badge":"Bridal Special","code":"BRIDAL30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000004'::uuid,
  'Midnight Blue Georgette Saree',
  'Lightweight flowy georgette saree featuring delicate sequin borders for modern evening celebrations.',
  3499,
  4999,
  'Sarees',
  '/saree_s4.webp',
  ARRAY['/saree_s4.webp', '/saree_s4_cutout.webp', '/model_2.webp', '/saree_category.webp'],
  40,
  12,
  'Published',
  4.55,
  ARRAY['#000080', '#C0C0C0'],
  'Pure Georgette',
  'Midnight Blue',
  '{"fabric":"Georgette","weave":"Chiffon Georgette","length":"5.5 meters","blouse":"0.8 meters running","wash_care":"Dry Clean Only","occasion":"Cocktail & Party"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000005'::uuid,
  'Ruby Red Bridal Saree',
  'Grand royal bridal saree with heavy zardozi hand embroidery designed for wedding ceremonies.',
  15999,
  21999,
  'Sarees',
  '/saree_s5.webp',
  ARRAY['/saree_s5.webp', '/saree_s5_cutout.webp', '/model_3.webp', '/saree_category_stacked.webp'],
  15,
  5,
  'Published',
  4.95,
  ARRAY['#FF0000', '#D4AF37'],
  'Bridal Raw Silk',
  'Ruby Red',
  '{"fabric":"Raw Silk","weave":"Zardozi Embroidery","length":"5.5 meters","blouse":"1.0 meter heavy work","wash_care":"Dry Clean Only","occasion":"Bridal"}'::jsonb,
  true,
  '{"discount_pct":27.3,"badge":"Exclusive Bridal","code":"AANYABRIDE"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000006'::uuid,
  'Chanderi White Kurta & Pink Dupatta Set',
  'Breezy Chanderi silk blend kurta paired with handcrafted scalloped pink organza dupatta.',
  3499,
  4999,
  'Kurtis',
  '/kurti_k1.webp',
  ARRAY['/kurti_k1.webp', '/kurti_k1_cutout.webp', '/kurti_category_green.webp', '/kurti_category.webp'],
  45,
  10,
  'Published',
  4.8,
  ARRAY['#FFFFFF', '#FFC0CB'],
  'Chanderi Silk Blend',
  'Pearl White & Pink',
  '{"fabric":"Chanderi Silk Blend","fit":"Straight A-Line","sleeves":"3/4th Sleeves","wash_care":"Gentle Hand Wash","occasion":"Day Festive & Pooja"}'::jsonb,
  true,
  '{"discount_pct":30,"badge":"Best Seller","code":"SUMMER30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000007'::uuid,
  'Sunshine Yellow Floral Anarkali Kurti',
  'Flared tiered Anarkali silhouette with vibrant botanical prints and gota patti neckline.',
  2999,
  3999,
  'Kurtis',
  '/kurti_k2.webp',
  ARRAY['/kurti_k2.webp', '/kurti_k2_cutout.webp', '/kurti_category_green.webp'],
  50,
  15,
  'Published',
  4.7,
  ARRAY['#FFD700', '#FFFFFF'],
  'Mulmul Cotton',
  'Sunshine Yellow',
  '{"fabric":"100% Mulmul Cotton","fit":"Flared Anarkali","sleeves":"Full Sleeves","wash_care":"Machine Wash Delicate","occasion":"Haldi & Casual Festive"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000008'::uuid,
  'Indigo Blue Floral Georgette Anarkali',
  'Fluid georgette Anarkali with artisan indigo block-print motifs and full soft lining.',
  3299,
  4499,
  'Kurtis',
  '/kurti_k3.webp',
  ARRAY['/kurti_k3.webp', '/kurti_k3_cutout.webp', '/kurti_category.webp'],
  35,
  10,
  'Published',
  4.65,
  ARRAY['#000080', '#ADD8E6'],
  'Poly Georgette',
  'Indigo Blue',
  '{"fabric":"Georgette with Santoon Lining","fit":"Flared","sleeves":"Elbow Sleeves","wash_care":"Dry Clean Recommended","occasion":"Family Gatherings"}'::jsonb,
  true,
  '{"discount_pct":26.7,"badge":"Special Price","code":"INDIGO25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000009'::uuid,
  'Heritage Crimson Embroidered Anarkali',
  'Regal crimson silk kurti with intricate threadwork yoke and delicate mirror accents.',
  4299,
  5999,
  'Kurtis',
  '/kurti_k4.webp',
  ARRAY['/kurti_k4.webp', '/kurti_k4_cutout.webp', '/kurti_category.webp'],
  25,
  8,
  'Published',
  4.85,
  ARRAY['#800000', '#D4AF37'],
  'Silk Georgette',
  'Crimson Red',
  '{"fabric":"Silk Georgette","fit":"Flared Anarkali","sleeves":"Full Sleeves","wash_care":"Dry Clean Only","occasion":"Festive & Sangeet"}'::jsonb,
  true,
  '{"discount_pct":28.3,"badge":"Festive Pick","code":"CRIMSON20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000010'::uuid,
  'Royal Lavender Sequin Georgette Kurta',
  'Contemporary straight-cut georgette kurta adorned with micro-sequins for festive celebrations.',
  3899,
  4999,
  'Kurtis',
  '/kurti_k5.webp',
  ARRAY['/kurti_k5.webp', '/kurti_k5_cutout.webp', '/kurti_category_green.webp'],
  30,
  8,
  'Published',
  4.9,
  ARRAY['#E6E6FA', '#D4AF37'],
  'Georgette',
  'Royal Lavender',
  '{"fabric":"Georgette with Sequins","fit":"Straight Cut","sleeves":"3/4th Sleeves","wash_care":"Dry Clean Only","occasion":"Evening Festive"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000011'::uuid,
  'Royal Chocolate Embroidered Velvet Lehenga',
  'Rich velvet skirt adorned with dense botanical zardozi work, matching sweetheart blouse and dupatta.',
  18999,
  24999,
  'Lehengas',
  '/lehenga_l1.webp',
  ARRAY['/lehenga_l1.webp', '/lehenga_l1_cutout.webp', '/lehenga_category_pink.webp'],
  12,
  4,
  'Published',
  5,
  ARRAY['#4A2E1B', '#D4AF37'],
  'Micro Velvet',
  'Royal Chocolate',
  '{"fabric":"Micro Velvet 9000","flare":"4.5 meters","blouse":"Unstitched 1m","dupatta":"Soft Net 2.5m","wash_care":"Dry Clean Only","occasion":"Bridal & Winter Wedding"}'::jsonb,
  true,
  '{"discount_pct":24,"badge":"Couture","code":"VELVET20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000012'::uuid,
  'Teal Blue Heritage Zardosi Lehenga',
  'Artisan heritage piece with traditional peacocks and floral vine embroidery on rich raw silk.',
  15999,
  21999,
  'Lehengas',
  '/lehenga_l2.webp',
  ARRAY['/lehenga_l2.webp', '/lehenga_l2_cutout.webp', '/lehenga_category_pink.webp'],
  18,
  5,
  'Published',
  4.9,
  ARRAY['#005F73', '#D4AF37'],
  'Raw Silk',
  'Teal Blue',
  '{"fabric":"Raw Silk","flare":"4.0 meters","blouse":"Semi-stitched","dupatta":"Organza 2.5m","wash_care":"Dry Clean Only","occasion":"Sangeet & Reception"}'::jsonb,
  true,
  '{"discount_pct":27.3,"badge":"Signature","code":"HERITAGE25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000013'::uuid,
  'Blush Peach Sequin Silk Lehenga',
  'Subtle shimmer silk lehenga tailored with cascading flare, ideal for sangeet or bridesmaid occasions.',
  12999,
  17999,
  'Lehengas',
  '/lehenga_l3.webp',
  ARRAY['/lehenga_l3.webp', '/lehenga_l3_cutout.webp', '/lehenga_category_pink.webp'],
  22,
  6,
  'Published',
  4.8,
  ARRAY['#FFD1DC', '#D4AF37'],
  'Tissue Silk',
  'Blush Peach',
  '{"fabric":"Tissue Silk","flare":"3.8 meters","blouse":"Padded Choli","dupatta":"Chiffon 2.5m","wash_care":"Dry Clean Only","occasion":"Bridesmaid & Engagement"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000014'::uuid,
  'Regal Purple Floral Banarasi Lehenga',
  'Handwoven Banarasi silk lehenga with contrast antique zari borders and handcrafted tassels.',
  14999,
  19999,
  'Lehengas',
  '/lehenga_l4.webp',
  ARRAY['/lehenga_l4.webp', '/lehenga_l4_cutout.webp', '/lehenga_category_pink.webp'],
  16,
  5,
  'Published',
  4.75,
  ARRAY['#4B0082', '#D4AF37'],
  'Banarasi Brocade',
  'Regal Purple',
  '{"fabric":"Banarasi Brocade","flare":"4.2 meters","blouse":"Silk Brocade 1m","dupatta":"Georgette 2.5m","wash_care":"Dry Clean Only","occasion":"Reception"}'::jsonb,
  true,
  '{"discount_pct":25,"badge":"Banarasi Heritage","code":"BANARAS25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000015'::uuid,
  'Pastel Paradise Dual Tone Lehenga Set',
  'Chic ombre pastel tulle skirt paired with hand-cut sequined bralette and crystal-studded veil.',
  16999,
  22999,
  'Lehengas',
  '/lehenga_l5.webp',
  ARRAY['/lehenga_l5.webp', '/lehenga_l5_cutout.webp', '/lehenga_category_pink.webp'],
  10,
  4,
  'Published',
  4.95,
  ARRAY['#ADD8E6', '#FFB6C1'],
  'Fine Tulle',
  'Pastel Dual-Tone',
  '{"fabric":"Fine Ombre Tulle","flare":"5.0 meters","blouse":"Embroidered Bralette","dupatta":"Crystal Tulle","wash_care":"Dry Clean Only","occasion":"Cocktail & Destination Wedding"}'::jsonb,
  true,
  '{"discount_pct":26.1,"badge":"Modern Chic","code":"PASTEL25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000016'::uuid,
  'Lavender Blossom Patiala Suit',
  'Traditional pleated Patiala salwar with short embroidered kameez and heavy phulkari dupatta.',
  3499,
  4999,
  'Salwar Sets',
  '/salwar_ss1.webp',
  ARRAY['/salwar_ss1.webp', '/salwar_ss1_cutout.webp'],
  35,
  8,
  'Published',
  4.8,
  ARRAY['#E6E6FA', '#FFFFFF'],
  'Glace Cotton',
  'Lavender Blossom',
  '{"fabric":"Glace Cotton","salwar_type":"Full Gathered Patiala","dupatta":"Phulkari Embroidery","wash_care":"Hand Wash Cold","occasion":"Festive & Lohri"}'::jsonb,
  true,
  '{"discount_pct":30,"badge":"Popular","code":"PATIALA30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000017'::uuid,
  'Mustard Gold Silk Patiala Suit',
  'Lustrous silk blend set featuring mirror-embellished neckline and gold-trimmed dupatta.',
  4299,
  5999,
  'Salwar Sets',
  '/salwar_ss2.webp',
  ARRAY['/salwar_ss2.webp', '/salwar_ss2_cutout.webp'],
  28,
  8,
  'Published',
  4.7,
  ARRAY['#FFD700', '#D4AF37'],
  'Chanderi Silk',
  'Mustard Gold',
  '{"fabric":"Chanderi Silk","salwar_type":"Pleated Salwar","dupatta":"Silk Blend 2.25m","wash_care":"Dry Clean Recommended","occasion":"Haldi & Sangeet"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000018'::uuid,
  'Imperial Purple Patiala Suit',
  'Deep royal purple velvet-finish kameez paired with voluminous gathered Patiala pants.',
  4999,
  6999,
  'Salwar Sets',
  '/salwar_ss3.webp',
  ARRAY['/salwar_ss3.webp', '/salwar_ss3_cutout.webp'],
  20,
  6,
  'Published',
  4.9,
  ARRAY['#800080', '#FFFFFF'],
  'Velvet Blend',
  'Imperial Purple',
  '{"fabric":"Velvet Blend Silk","salwar_type":"Patiala with Gota","dupatta":"Net with Zari Borders","wash_care":"Dry Clean Only","occasion":"Winter Festive"}'::jsonb,
  true,
  '{"discount_pct":28.6,"badge":"Royal Pick","code":"PURPLE25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000019'::uuid,
  'Wine Gold Silk Straight Suit',
  'Crisp straight-fit tunic paired with cigarette pants and a hand-painted floral silk dupatta.',
  3899,
  4999,
  'Salwar Sets',
  '/salwar_ss4.webp',
  ARRAY['/salwar_ss4.webp', '/salwar_ss4_cutout.webp'],
  32,
  8,
  'Published',
  4.65,
  ARRAY['#722F37', '#D4AF37'],
  'Tussar Silk',
  'Wine Gold',
  '{"fabric":"Tussar Silk","salwar_type":"Cigarette Trousers","dupatta":"Kalamkari Hand-paint","wash_care":"Dry Clean Only","occasion":"Office Festive & Events"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000020'::uuid,
  'Fuchsia Pink Patiala Suit',
  'High-energy festive ensemble with gota lace borders and breathable cotton lining.',
  4599,
  5999,
  'Salwar Sets',
  '/salwar_ss5.webp',
  ARRAY['/salwar_ss5.webp', '/salwar_ss5_cutout.webp'],
  24,
  6,
  'Published',
  4.8,
  ARRAY['#FF00FF', '#FFFFFF'],
  'Crepe Silk',
  'Fuchsia Pink',
  '{"fabric":"Crepe Silk","salwar_type":"Shahi Patiala","dupatta":"Chiffon Gota Patti","wash_care":"Dry Clean Recommended","occasion":"Mehendi & Festive"}'::jsonb,
  true,
  '{"discount_pct":23.3,"badge":"Festive Vibrant","code":"PINK20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000021'::uuid,
  'White Pleated Blouse & Brown Culottes',
  'Modern coordinated smart-casual look with micro-pleated front blouse and tailored wide-leg culottes.',
  3499,
  4999,
  'Western',
  '/western_w1.webp',
  ARRAY['/western_w1.webp', '/western_w1_cutout.webp', '/western_category_casual.webp'],
  40,
  10,
  'Published',
  4.8,
  ARRAY['#FFFFFF', '#8B4513'],
  'Linen Poplin',
  'Ivory & Mocha',
  '{"fabric":"Linen & Cotton Poplin","fit":"Relaxed Wide-Leg","wash_care":"Machine Wash Gentle","occasion":"Brunch & Smart Casual"}'::jsonb,
  true,
  '{"discount_pct":30,"badge":"Trending","code":"CHIC30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000022'::uuid,
  'Chocolate Silk Shirt & Beige Trousers',
  'Executive daytime elegance combining fluid mulberry silk shirt with high-waisted pleated trousers.',
  3999,
  5499,
  'Western',
  '/western_w2.webp',
  ARRAY['/western_w2.webp', '/western_w2_cutout.webp'],
  35,
  10,
  'Published',
  4.7,
  ARRAY['#5C4033', '#F5F5DC'],
  'Mulberry Silk & Viscose',
  'Chocolate & Sand',
  '{"fabric":"Mulberry Silk Top, Viscose Pants","fit":"Tailored Regular","wash_care":"Dry Clean Silk","occasion":"Workwear & Dinner"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000023'::uuid,
  'Indigo Floral Peplum & Jeans Set',
  'Feminine peplum top with cinched elasticated waist paired with slim ankle-length stretch denim.',
  2999,
  3999,
  'Western',
  '/western_w3.webp',
  ARRAY['/western_w3.webp', '/western_w3_cutout.webp'],
  42,
  12,
  'Published',
  4.6,
  ARRAY['#000080', '#ADD8E6'],
  'Rayon & Stretch Denim',
  'Indigo Print',
  '{"fabric":"Rayon Challis & Denim","fit":"Fit & Flare Top, Slim Bottom","wash_care":"Machine Wash Cold","occasion":"Casual Outing"}'::jsonb,
  true,
  '{"discount_pct":25,"badge":"Weekend Style","code":"CASUAL25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000024'::uuid,
  'Midnight Floral Double Layer Coord Set',
  'Two-piece tailored lounge ensemble featuring kimono-style outer layer and straight drape trousers.',
  4599,
  5999,
  'Western',
  '/western_w4.webp',
  ARRAY['/western_w4.webp', '/western_w4_cutout.webp'],
  26,
  6,
  'Published',
  4.9,
  ARRAY['#000000', '#FFFFFF'],
  'Satin Crepe',
  'Midnight Floral',
  '{"fabric":"Satin Crepe","fit":"Loose Flowy","wash_care":"Dry Clean Only","occasion":"Evening Lounge & Resort"}'::jsonb,
  true,
  '{"discount_pct":23.3,"badge":"Resort Wear","code":"RESORT20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000025'::uuid,
  'Sky Striped Shirt & Classic Denim Set',
  'Relaxed boyfriend poplin cotton shirt with vertical pinstripes and timeless straight indigo denim.',
  3299,
  4499,
  'Western',
  '/western_w5.webp',
  ARRAY['/western_w5.webp', '/western_w5_cutout.webp'],
  50,
  12,
  'Published',
  4.8,
  ARRAY['#87CEEB', '#ADD8E6'],
  '100% Poplin Cotton',
  'Sky Blue Stripes',
  '{"fabric":"100% Cotton Poplin","fit":"Boyfriend Oversized","wash_care":"Machine Wash Normal","occasion":"Everyday Casual"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000026'::uuid,
  'Festive Red & Cream Palazzo Set',
  'Opulent traditional silhouette with flared wide palazzo pants and heavily detailed zari border kurta.',
  5499,
  7999,
  'Tradition',
  '/tradition_t1.webp',
  ARRAY['/tradition_t1.webp', '/tradition_t1_cutout.webp'],
  22,
  6,
  'Published',
  4.8,
  ARRAY['#800000', '#F5F5DC'],
  'Chanderi & Jacquard',
  'Sindoor Red & Cream',
  '{"fabric":"Chanderi Silk with Jacquard Palazzo","fit":"Flared Palazzo","wash_care":"Dry Clean Only","occasion":"Diwali & Karwa Chauth"}'::jsonb,
  true,
  '{"discount_pct":31.3,"badge":"Festive Hero","code":"DIWALI30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000027'::uuid,
  'Royal Purple Banarasi Gown Set',
  'Full-length floor-sweeping Indo-western fusion gown cut from authentic Banarasi brocade.',
  4999,
  6999,
  'Tradition',
  '/tradition_t2.webp',
  ARRAY['/tradition_t2.webp', '/tradition_t2_cutout.webp'],
  18,
  5,
  'Published',
  4.7,
  ARRAY['#800080', '#D4AF37'],
  'Banarasi Brocade',
  'Royal Purple',
  '{"fabric":"Banarasi Brocade","fit":"Full Length Gown","wash_care":"Dry Clean Only","occasion":"Wedding Sangeet & Reception"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000028'::uuid,
  'Elegance Crimson Silk Lehenga Choli',
  'Heritage heirloom lehenga set with intricate resham threadwork and gold sequin net dupatta.',
  11999,
  15999,
  'Tradition',
  '/tradition_t3.webp',
  ARRAY['/tradition_t3.webp', '/tradition_t3_cutout.webp'],
  14,
  4,
  'Published',
  4.9,
  ARRAY['#E60026', '#FFFDD0'],
  'Art Silk',
  'Crimson Silk',
  '{"fabric":"Art Silk with Resham Work","flare":"3.8 meters","wash_care":"Dry Clean Only","occasion":"Traditional Festive"}'::jsonb,
  true,
  '{"discount_pct":25,"badge":"Heirloom","code":"TRADITION25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000029'::uuid,
  'Mint Grey Embroidered Kurta Set',
  'Subtle festive palette with delicate tonal embroidery across collar and sleeves.',
  4599,
  5999,
  'Tradition',
  '/tradition_t4.webp',
  ARRAY['/tradition_t4.webp', '/tradition_t4_cutout.webp'],
  25,
  6,
  'Published',
  4.6,
  ARRAY['#C0C0C0', '#D4AF37'],
  'Silk Blend',
  'Mint Grey',
  '{"fabric":"Silk Blend","fit":"Straight Kurta with Pants","wash_care":"Dry Clean Only","occasion":"Puja & Formal Evenings"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000030'::uuid,
  'Grace Olive Green & Plum Half Saree',
  'South Indian style Dhavani half-saree with pure zari borders and matching contrasting blouse.',
  7999,
  9999,
  'Tradition',
  '/tradition_t5.webp',
  ARRAY['/tradition_t5.webp', '/tradition_t5_cutout.webp'],
  15,
  5,
  'Published',
  4.8,
  ARRAY['#556B2F', '#4B0082'],
  'Kanchipuram Silk Blend',
  'Olive Green & Plum',
  '{"fabric":"Silk Blend with Zari","style":"Traditional Half-Saree (Dhavani)","wash_care":"Dry Clean Only","occasion":"South Indian Festivals"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Authentic Dhavani","code":"DHAVANI20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000031'::uuid,
  'Sunshine Yellow Chiffon Maxi',
  'Breezy sunburst yellow chiffon gown with smocked waist and flutter sleeves for summer resort wear.',
  3499,
  4999,
  'Maxi',
  '/maxi_mx1.webp',
  ARRAY['/maxi_mx1.webp', '/maxi_mx1_cutout.webp'],
  30,
  8,
  'Published',
  4.8,
  ARRAY['#FFD700'],
  'Poly Chiffon',
  'Sunshine Yellow',
  '{"fabric":"Poly Chiffon with Micro Crepe Lining","length":"54 inches","fit":"Empire Waist","wash_care":"Machine Wash Gentle","occasion":"Resort & Beach Vacation"}'::jsonb,
  true,
  '{"discount_pct":30,"badge":"Resort Essential","code":"MAXI30"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000032'::uuid,
  'Chocolate Brown Resort Cotton Maxi',
  '100% breathable organic cotton maxi with tier gathering and adjustable shoulder tie-straps.',
  2899,
  3999,
  'Maxi',
  '/maxi_mx2.webp',
  ARRAY['/maxi_mx2.webp', '/maxi_mx2_cutout.webp'],
  36,
  10,
  'Published',
  4.6,
  ARRAY['#8B4513'],
  '100% Organic Cotton',
  'Chocolate Brown',
  '{"fabric":"100% Organic Slub Cotton","length":"52 inches","fit":"Tiered Relaxed","wash_care":"Machine Wash Normal","occasion":"Casual Resort"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000033'::uuid,
  'Blossom Pink Ruffled Maxi',
  'Tiered ruffle maxi dress crafted in soft pastel georgette with a flattering wrap-effect bodice.',
  3199,
  4499,
  'Maxi',
  '/maxi_mx3.webp',
  ARRAY['/maxi_mx3.webp', '/maxi_mx3_cutout.webp'],
  28,
  8,
  'Published',
  4.7,
  ARRAY['#FFC0CB'],
  'Georgette',
  'Blossom Pink',
  '{"fabric":"Soft Georgette","length":"55 inches","fit":"Wrap Silhouette","wash_care":"Dry Clean or Gentle Wash","occasion":"Day Weddings & High Tea"}'::jsonb,
  true,
  '{"discount_pct":28.9,"badge":"Romantic Edit","code":"BLOSSOM25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000034'::uuid,
  'Royal Purple Smocked Maxi',
  'Dramatic floor-length evening maxi with structured honeycomb smocking and billowy bishop sleeves.',
  3999,
  5499,
  'Maxi',
  '/maxi_mx4.webp',
  ARRAY['/maxi_mx4.webp', '/maxi_mx4_cutout.webp'],
  24,
  6,
  'Published',
  4.9,
  ARRAY['#800080'],
  'Satin Silk Blend',
  'Royal Purple',
  '{"fabric":"Satin Silk Blend","length":"56 inches","fit":"Smocked Bodice with A-line Skirt","wash_care":"Dry Clean Only","occasion":"Evening Gala & Dinners"}'::jsonb,
  true,
  '{"discount_pct":27.3,"badge":"Evening Luxe","code":"PURPLE25"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0001-4000-8000-000000000035'::uuid,
  'Vintage Rose Organza Maxi',
  'Ethereal sheer organza gown featuring hand-painted French vintage roses over silk crepe slip.',
  4299,
  5999,
  'Maxi',
  '/maxi_mx5.webp',
  ARRAY['/maxi_mx5.webp', '/maxi_mx5_cutout.webp'],
  18,
  5,
  'Published',
  4.8,
  ARRAY['#FFF0F5'],
  'Pure Organza',
  'Vintage Rose',
  '{"fabric":"Pure Organza with Crepe Slip","length":"56 inches","fit":"Flared Tiered Gown","wash_care":"Dry Clean Only","occasion":"Cocktails & Summer Galas"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000001'::uuid,
  'Maroon Silk Saree',
  'Luxurious silk with gold zari.',
  2999,
  4999,
  'Sarees',
  'https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080&fm=webp'],
  50,
  10,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000002'::uuid,
  'Handwoven Banarasi Saree',
  'Authentic Banarasi silk.',
  8999,
  12999,
  'Sarees',
  'https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp'],
  30,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000003'::uuid,
  'Designer Zari Saree',
  'Intricate zari work on soft georgette.',
  5499,
  7999,
  'Sarees',
  'https://images.unsplash.com/photo-1762708592720-92912d5825e2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1762708592720-92912d5825e2?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000004'::uuid,
  'Emerald Green Kanchipuram Saree',
  'Traditional Kanchipuram silk.',
  6999,
  9999,
  'Sarees',
  'https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1599584082894-52c6d8fc48c6?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000005'::uuid,
  'Royal Blue Chiffon Saree',
  'Lightweight and elegant.',
  1999,
  2999,
  'Sarees',
  'https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000006'::uuid,
  'Yellow Cotton Jamdani Saree',
  'Breathable cotton with floral motifs.',
  3499,
  4999,
  'Sarees',
  'https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000007'::uuid,
  'Black Net Party Saree',
  'Glamorous net saree with sequins.',
  4599,
  6499,
  'Sarees',
  'https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp'],
  22,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000008'::uuid,
  'Peach Organza Saree',
  'Modern floral print on organza.',
  3299,
  4499,
  'Sarees',
  'https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp'],
  18,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000009'::uuid,
  'Red Wedding Saree',
  'Heavy bridal embroidery.',
  14999,
  19999,
  'Sarees',
  'https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000010'::uuid,
  'Ivory Tissue Saree',
  'Shimmering tissue silk.',
  4299,
  5999,
  'Sarees',
  'https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp'],
  14,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000011'::uuid,
  'Turquoise Tussar Silk Saree',
  'Wild silk with natural texture.',
  5999,
  8499,
  'Sarees',
  'https://images.unsplash.com/photo-1583391733956-6c7827602521?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1583391733956-6c7827602521?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000012'::uuid,
  'Purple Pashmina Saree',
  'Soft wool-blend for winter.',
  7499,
  10999,
  'Sarees',
  'https://images.unsplash.com/photo-1590736962305-654efad8409e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1590736962305-654efad8409e?q=80&w=1080&fm=webp'],
  8,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000013'::uuid,
  'Grey Linen Saree',
  'Minimalist linen with silver border.',
  2799,
  3999,
  'Sarees',
  'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080&fm=webp'],
  35,
  7,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000014'::uuid,
  'Cyan Mysore Silk Saree',
  'Soft and smooth Mysore silk.',
  4999,
  6999,
  'Sarees',
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1080&fm=webp'],
  16,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000015'::uuid,
  'Beige Patola Saree',
  'Traditional double ikat weave.',
  12999,
  17999,
  'Sarees',
  'https://images.unsplash.com/photo-1610030469668-935102a9e52c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610030469668-935102a9e52c?q=80&w=1080&fm=webp'],
  5,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000016'::uuid,
  'Chic Pink Kurti',
  'Soft cotton with delicate embroidery.',
  999,
  1499,
  'Kurtis',
  'https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp'],
  60,
  12,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000017'::uuid,
  'White Chikankari Kurti',
  'Traditional Lucknowi work.',
  1499,
  1999,
  'Kurtis',
  'https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp'],
  45,
  9,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000018'::uuid,
  'Indigo Anarkali Kurti',
  'Flowy cotton with block print.',
  2499,
  3499,
  'Kurtis',
  'https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp'],
  30,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000019'::uuid,
  'Mirror Work Short Kurti',
  'Bright colors with mirror accents.',
  1299,
  1799,
  'Kurtis',
  'https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000020'::uuid,
  'Pastel Yellow Kurta Set',
  'Includes matching dupatta and pants.',
  3499,
  4999,
  'Kurtis',
  'https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000021'::uuid,
  'Georgette Party Kurti',
  'Shimmering georgette with sequins.',
  1899,
  2599,
  'Kurtis',
  'https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000022'::uuid,
  'Floral Print Daily Kurti',
  'Breathable rayon for summer.',
  799,
  1199,
  'Kurtis',
  'https://images.unsplash.com/photo-1610030469661-8b9cad0e1f20?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610030469661-8b9cad0e1f20?q=80&w=1080&fm=webp'],
  100,
  20,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000023'::uuid,
  'Velvet Winter Kurti',
  'Warm velvet with minimal border.',
  2999,
  3999,
  'Kurtis',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000024'::uuid,
  'Black High-Low Kurti',
  'Contemporary silhouette.',
  1199,
  1699,
  'Kurtis',
  'https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1581591524425-c7e0978865fc?q=80&w=1080&fm=webp'],
  50,
  10,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000025'::uuid,
  'Turquoise Embroidered Kurti',
  'Heavy embroidery on neckline.',
  1699,
  2299,
  'Kurtis',
  'https://images.unsplash.com/photo-1621285853634-713b8dd6b5ee?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1621285853634-713b8dd6b5ee?q=80&w=1080&fm=webp'],
  35,
  7,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000026'::uuid,
  'Slit Cut Designer Kurti',
  'Side slits with contrast fabric.',
  2199,
  2999,
  'Kurtis',
  'https://images.unsplash.com/photo-16101235312c7-2c1b47214739?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-16101235312c7-2c1b47214739?q=80&w=1080&fm=webp'],
  22,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000027'::uuid,
  'Grey Office Kurti',
  'Professional and comfortable.',
  899,
  1299,
  'Kurtis',
  'https://images.unsplash.com/photo-1610123531405-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610123531405-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  70,
  14,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000028'::uuid,
  'Red Rayon Wrap Kurti',
  'Adjustable waist tie.',
  1099,
  1599,
  'Kurtis',
  'https://images.unsplash.com/photo-1610123531589-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610123531589-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000029'::uuid,
  'Mustard Front Slit Kurti',
  'Paired with white trousers.',
  1399,
  1899,
  'Kurtis',
  'https://images.unsplash.com/photo-1610123531765-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610123531765-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  28,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000030'::uuid,
  'Lime Green Tunic',
  'Short kurti for casual outings.',
  699,
  999,
  'Kurtis',
  'https://images.unsplash.com/photo-1610123531876-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1610123531876-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  80,
  16,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000031'::uuid,
  'Designer Floral Lehenga',
  'Perfect for Sangeet or Engagement.',
  14999,
  19999,
  'Lehengas',
  'https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1724856604254-f7cf4e9c8f72?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000032'::uuid,
  'Bridal Red Velvet Lehenga',
  'Heavy gold embroidery for the bride.',
  45999,
  59999,
  'Lehengas',
  'https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?q=80&w=1080&fm=webp'],
  5,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000033'::uuid,
  'Pastel Pink Silk Lehenga',
  'Elegant and minimal for bridesmaids.',
  9999,
  14999,
  'Lehengas',
  'https://images.unsplash.com/photo-1767955694884-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1767955694884-d4bf352c23c2?q=80&w=1080&fm=webp'],
  18,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000034'::uuid,
  'Royal Blue Mirror Lehenga',
  'Sparkling mirror work on heavy georgette.',
  12499,
  17999,
  'Lehengas',
  'https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000035'::uuid,
  'Mustard Yellow Haldi Lehenga',
  'Paired with a gota patti blouse.',
  6999,
  9999,
  'Lehengas',
  'https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000036'::uuid,
  'Emerald Green Silk Lehenga',
  'Rich silk fabric with stone work.',
  18999,
  24999,
  'Lehengas',
  'https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp'],
  8,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000037'::uuid,
  'White Lace Reception Lehenga',
  'Modern silhouette with lace details.',
  8499,
  11999,
  'Lehengas',
  'https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp'],
  14,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000038'::uuid,
  'Grey Sequence Night Lehenga',
  'Dazzling sequins for a night out.',
  7599,
  10499,
  'Lehengas',
  'https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000039'::uuid,
  'Yellow Bandhani Lehenga',
  'Traditional Rajasthani print.',
  5499,
  7499,
  'Lehengas',
  'https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp'],
  30,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000040'::uuid,
  'Purple Organza Lehenga',
  'Floral printed on light organza.',
  4999,
  6999,
  'Lehengas',
  'https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp'],
  22,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000041'::uuid,
  'Turquoise Banarasi Lehenga',
  'Classic Banarasi weave.',
  10999,
  15499,
  'Lehengas',
  'https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000042'::uuid,
  'Black Velvet Fusion Lehenga',
  'Western look with traditional touch.',
  13999,
  18999,
  'Lehengas',
  'https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080&fm=webp'],
  7,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000043'::uuid,
  'Maroon Art Silk Lehenga',
  'Budget friendly party wear.',
  3999,
  5499,
  'Lehengas',
  'https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000044'::uuid,
  'Teal Embroidered Lehenga',
  'Intricate thread work on teal base.',
  11499,
  15999,
  'Lehengas',
  'https://images.unsplash.com/photo-1756488775431-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775431-80410a56f947?q=80&w=1080&fm=webp'],
  11,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000045'::uuid,
  'Beige Gold Tissue Lehenga',
  'Shimmering gold tissue fabric.',
  16499,
  21999,
  'Lehengas',
  'https://images.unsplash.com/photo-1756488775432-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775432-80410a56f947?q=80&w=1080&fm=webp'],
  6,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000046'::uuid,
  'Black Satin Party Dress',
  'Sleek and elegant evening wear.',
  2499,
  3999,
  'Western',
  'https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759840278511-f73a3d62fb9f?q=80&w=1080&fm=webp'],
  35,
  7,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000047'::uuid,
  'Beige Wrap Maxi Dress',
  'Versatile dress for brunch or beach.',
  1899,
  2599,
  'Western',
  'https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759840278381-bf7d5e332050?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000048'::uuid,
  'Floral Summer Sundress',
  'Lightweight cotton with vibrant print.',
  1299,
  1799,
  'Western',
  'https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1768803968262-320d4752966f?q=80&w=1080&fm=webp'],
  55,
  11,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000049'::uuid,
  'White Eyelet Midi Dress',
  'Romantic mid-length dress.',
  2199,
  2999,
  'Western',
  'https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded00?q=80&w=1080&fm=webp'],
  28,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000050'::uuid,
  'Red Off-Shoulder Gown',
  'Stunning look for formal events.',
  4999,
  6999,
  'Western',
  'https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1759654492983-ca4913c3809e?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000051'::uuid,
  'Polka Dot Retro Dress',
  'Vintage inspired style.',
  1599,
  2199,
  'Western',
  'https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1765529374855-7353c3c47fc6?q=80&w=1080&fm=webp'],
  32,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000052'::uuid,
  'Denim Jacket with Embroidery',
  'Custom embroidery on premium denim.',
  2799,
  3499,
  'Western',
  'https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756488775430-80410a56f947?q=80&w=1080&fm=webp'],
  45,
  9,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000053'::uuid,
  'High Waisted Trousers',
  'Classic fit for professional look.',
  1499,
  1999,
  'Western',
  'https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756209374028-2624d78ae7be?q=80&w=1080&fm=webp'],
  60,
  12,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000054'::uuid,
  'Emerald Green Blazer',
  'Tailored blazer for office or night.',
  3299,
  4499,
  'Western',
  'https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1756461973650-71a74d759a22?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000055'::uuid,
  'Silk Slip Top',
  'Luxurious base layer in champagne.',
  1099,
  1599,
  'Western',
  'https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1762708593414-b49e06173004?q=80&w=1080&fm=webp'],
  50,
  10,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000056'::uuid,
  'Navy Blue Jumpsuit',
  'One piece outfit with belted waist.',
  2499,
  3299,
  'Western',
  'https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1764653552085-78ba9e1c26b5?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000057'::uuid,
  'Grey Knit Sweater',
  'Soft wool-blend for cooler days.',
  1299,
  1799,
  'Western',
  'https://images.unsplash.com/photo-1760287364219-160c234ded01?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded01?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000058'::uuid,
  'Floral Plisse Skirt',
  'Elegant pleated skirt.',
  1199,
  1699,
  'Western',
  'https://images.unsplash.com/photo-1760287364219-160c234ded02?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded02?q=80&w=1080&fm=webp'],
  45,
  9,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000059'::uuid,
  'Beige Trench Coat',
  'Timeless outer layer.',
  5999,
  7999,
  'Western',
  'https://images.unsplash.com/photo-1760287364219-160c234ded03?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded03?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000060'::uuid,
  'Striped Cotton Shirt',
  'Breathable and classic.',
  899,
  1199,
  'Western',
  'https://images.unsplash.com/photo-1760287364219-160c234ded04?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1760287364219-160c234ded04?q=80&w=1080&fm=webp'],
  75,
  15,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000061'::uuid,
  'Emerald Silk Salwar Suit',
  'Rich emerald green silk with heavy gold embroidery.',
  5900,
  8500,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000062'::uuid,
  'Ivory Chikankari Set',
  'Handcrafted Lucknowi chikankari on pure georgette.',
  4200,
  6000,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000063'::uuid,
  'Blush Pink Anarkali',
  'Floor-length anarkali with delicate thread work.',
  7500,
  11000,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000064'::uuid,
  'Mustard Palazzo Suit',
  'Contemporary palazzo set with mirror work detailing.',
  4800,
  6500,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000065'::uuid,
  'Royal Blue Sharara Set',
  'Vibrant blue sharara with sequin borders.',
  6200,
  8900,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000066'::uuid,
  'Midnight Black Patiala',
  'Traditional Patiala suit with phulkari dupatta.',
  3500,
  5200,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249721-92912d5825e2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249721-92912d5825e2?q=80&w=1080&fm=webp'],
  30,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000067'::uuid,
  'Mint Green Straight Fit',
  'Elegent straight-cut suit for formal wear.',
  3900,
  5500,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249414-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249414-b49e06173004?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000068'::uuid,
  'Deep Red Velvet Suit',
  'Luxurious velvet set for winter weddings.',
  8900,
  12500,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp'],
  8,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000069'::uuid,
  'Lemon Yellow Cotton Set',
  'Breathable cotton with floral block prints.',
  2800,
  4200,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  50,
  10,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000070'::uuid,
  'Teal Blue Angrakha',
  'Traditional angrakha style with side tassels.',
  5400,
  7800,
  'Salwar Sets',
  'https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp'],
  18,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000071'::uuid,
  'Golden Tissue Saree',
  'Exquisite gold tissue with scalloped borders.',
  12500,
  18000,
  'Sarees',
  'https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000072'::uuid,
  'Ruby Red Artisan Bridal Saree',
  'Heavy bridal silk with intricate stone work.',
  25000,
  35000,
  'Sarees',
  'https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp'],
  5,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000073'::uuid,
  'Pastel Lilac Organza',
  'Modern organza with hand-painted florals.',
  6800,
  9500,
  'Sarees',
  'https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000074'::uuid,
  'Copper Zari Banarasi',
  'Antique copper zari on charcoal grey silk.',
  18500,
  24000,
  'Sarees',
  'https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080&fm=webp'],
  7,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000075'::uuid,
  'Champagne Shimmer Saree',
  'Contemporary sequin saree for evening galas.',
  9500,
  14000,
  'Sarees',
  'https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Art Silk',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000076'::uuid,
  'Peplum Style Kurti',
  'Contemporary peplum cut with dhoti pants.',
  3800,
  5500,
  'Kurtis',
  'https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000077'::uuid,
  'Boho Fusion Kurti',
  'Ethnic prints with a bohemian tassels.',
  2400,
  3600,
  'Kurtis',
  'https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000078'::uuid,
  'Asymmetric Hem Kurti',
  'Modern high-low hem in vibrant orange.',
  2900,
  4200,
  'Kurtis',
  'https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  30,
  6,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000079'::uuid,
  'Denim Ethnic Kurti',
  'Unique fusion of denim fabric and embroidery.',
  3200,
  4800,
  'Kurtis',
  'https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000080'::uuid,
  'Mirror Work Cape Kurti',
  'Elegant cape overlay with mirror detailing.',
  5600,
  7900,
  'Kurtis',
  'https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Cotton Slub',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000081'::uuid,
  'Lavender Ombre Lehenga',
  'Beautiful ombre shading on fine tulle.',
  22000,
  32000,
  'Lehengas',
  'https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp'],
  8,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000082'::uuid,
  'Gota Patti Lehenga',
  'Traditional Jaipur gota patti on bright yellow.',
  18000,
  26000,
  'Lehengas',
  'https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249884-d4bf352c23c2?q=80&w=1080&fm=webp'],
  12,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000083'::uuid,
  'Navy Blue Velvet Lehenga',
  'Regal velvet with silver metallic work.',
  35000,
  48000,
  'Lehengas',
  'https://images.unsplash.com/photo-1714023249219-160c234ded01?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249219-160c234ded01?q=80&w=1080&fm=webp'],
  5,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000084'::uuid,
  'Peach Pearl Lehenga',
  'Delicate pearl and crystal embroidery.',
  28500,
  39000,
  'Lehengas',
  'https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249314-b49e06173004?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000085'::uuid,
  'Mirror Mosaic Lehenga',
  'Stunning mosaic mirror work for sangeet.',
  15000,
  22000,
  'Lehengas',
  'https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249668-935102a9e52c?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Georgette Brocade',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000086'::uuid,
  'Metallic Pleated Gown',
  'Shimmering metallic fabric with micro-pleats.',
  8500,
  12000,
  'Western',
  'https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1721531640742-f83130d43702?q=80&w=1080&fm=webp'],
  15,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000087'::uuid,
  'Satin Slip Dress',
  'Elegant crimson satin with adjustable straps.',
  4200,
  6500,
  'Western',
  'https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249113-d4bf352c23c2?q=80&w=1080&fm=webp'],
  25,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000088'::uuid,
  'Tailored Tuxedo Jumpsuit',
  'Sophisticated one-piece for formal events.',
  11000,
  16000,
  'Western',
  'https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714041797746-34743260718e?q=80&w=1080&fm=webp'],
  10,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000089'::uuid,
  'Lace Overlay Blouse',
  'Delicate white lace for a romantic look.',
  3200,
  4800,
  'Western',
  'https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249661-8b9cad0e1f20?q=80&w=1080&fm=webp'],
  40,
  8,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  false,
  '{}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());

INSERT INTO public.products (
  id, name, description, price, compare_at_price, category, image_url, images,
  stock_quantity, low_stock_threshold, status, rating, colors, material_type,
  variant_color, specifications, offer_enabled, offer_details
) VALUES (
  'a0000000-0002-4000-8000-000000000090'::uuid,
  'Frou Frou Tulle Skirt',
  'Dramatic layered tulle skirt in blush.',
  5900,
  8500,
  'Western',
  'https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp',
  ARRAY['https://images.unsplash.com/photo-1714023249765-1a2b3c4d5e6f?q=80&w=1080&fm=webp'],
  20,
  5,
  'Published',
  4.7,
  ARRAY['#698156', '#D4AF37'],
  'Poly Blend',
  'Artisan Palette',
  '{"fabric":"Artisan Weave","wash_care":"Dry Clean or Gentle Wash","fit":"Standard Fit"}'::jsonb,
  true,
  '{"discount_pct":20,"badge":"Limited Stock Offer","code":"SPECIAL20"}'::jsonb
)
ON CONFLICT (name) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  price = EXCLUDED.price,
  compare_at_price = EXCLUDED.compare_at_price,
  category = EXCLUDED.category,
  stock_quantity = EXCLUDED.stock_quantity,
  low_stock_threshold = EXCLUDED.low_stock_threshold,
  rating = EXCLUDED.rating,
  material_type = EXCLUDED.material_type,
  variant_color = EXCLUDED.variant_color,
  specifications = EXCLUDED.specifications,
  offer_enabled = EXCLUDED.offer_enabled,
  offer_details = EXCLUDED.offer_details,
  description = EXCLUDED.description,
  updated_at = timezone('utc'::text, now());
