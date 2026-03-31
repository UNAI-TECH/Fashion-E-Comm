-- =========================================================================
-- COMPLETE SUPABASE SCHEMA V2 (MIGRATED FROM MONGOOSE)
-- =========================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to avoid "already exists" errors during re-runs
drop table if exists public.banners cascade;
drop table if exists public.reviews cascade;
drop table if exists public.order_items cascade;
drop table if exists public.orders cascade;
drop table if exists public.cart_items cascade;
drop table if exists public.carts cascade;
drop table if exists public.coupons cascade;
drop table if exists public.products cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;

-- 1. Profiles (Extends Supabase Auth Users)
create table public.profiles (
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

-- 2. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  slug text unique not null,
  description text,
  image_url text,
  status text default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Products
create table public.products (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  description text,
  price numeric(10, 2) not null default 0,
  compare_at_price numeric(10, 2),
  category_id uuid references public.categories(id) on delete set null,
  images text[], -- Array of image URLs
  stock_quantity integer default 0 not null,
  status text default 'Published' check (status in ('Draft', 'Published', 'Archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Discounts / Coupons
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text default 'Percentage' check (discount_type in ('Percentage', 'Fixed')),
  discount_value numeric(10, 2) not null,
  status text default 'Active' check (status in ('Active', 'Paused', 'Expired')),
  usage_count integer default 0 not null,
  max_uses integer, -- Null means unlimited
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Carts
create table public.carts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Cart Items
create table public.cart_items (
  id uuid default uuid_generate_v4() primary key,
  cart_id uuid references public.carts(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer not null default 1,
  
  unique(cart_id, product_id)
);

-- 7. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method text check (payment_method in ('UPI', 'Card', 'Net Banking', 'COD')),
  payment_status text default 'Pending' check (payment_status in ('Pending', 'Success', 'Failed', 'Refunded')),
  tax_amount numeric(10, 2) default 0,
  shipping_fee numeric(10, 2) default 0,
  total_amount numeric(10, 2) not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  shipping_address jsonb not null,
  
  -- Extra meta from the user's Mongoose requirement
  payment_timestamp timestamp with time zone,
  payment_result jsonb,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price_at_time numeric(10, 2) not null,
  total_price numeric(10, 2) not null
);

-- 9. Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text default 'Approved' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(product_id, user_id)
);

-- 10. Banners (Optional content management)
create table public.banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  link_url text,
  image_url text not null,
  status text default 'Inactive' check (status in ('Active', 'Inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- Optional RLS logic if you plan to rely on direct frontend queries 
-- (If strictly using internal Node.js Service Key, these aren't required)
-- =========================================================================
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
