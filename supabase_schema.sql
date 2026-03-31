-- Enable UUID extension
create extension if not exists "uuid-ossp";

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
  name text not null,
  description text,
  price numeric(10, 2) not null,
  compare_at_price numeric(10, 2),
  category_id uuid references public.categories(id) on delete set null,
  image_url text,
  images text[], -- Array of image URLs
  stock_quantity integer default 0 not null,
  low_stock_threshold integer default 5 not null,
  status text default 'Draft' check (status in ('Draft', 'Published', 'Archived')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Discounts / Coupons
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  discount_type text check (discount_type in ('Percentage', 'Fixed')),
  discount_value numeric(10, 2) not null,
  status text default 'Active' check (status in ('Active', 'Paused', 'Expired')),
  usage_count integer default 0 not null,
  max_uses integer, -- Null means unlimited
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Orders
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  payment_method text check (payment_method in ('UPI', 'Card', 'Net Banking', 'COD')),
  payment_status text default 'Pending' check (payment_status in ('Pending', 'Success', 'Failed', 'Refunded')),
  subtotal numeric(10, 2) not null,
  discount_amount numeric(10, 2) default 0,
  tax_amount numeric(10, 2) default 0,
  shipping_fee numeric(10, 2) default 0,
  total_amount numeric(10, 2) not null,
  coupon_id uuid references public.coupons(id) on delete set null,
  shipping_address jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Order Items
create table public.order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  price_at_time numeric(10, 2) not null,
  total_price numeric(10, 2) not null
);

-- 7. Reviews
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  status text default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Banners
create table public.banners (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  link_url text,
  image_url text not null,
  status text default 'Inactive' check (status in ('Active', 'Inactive')),
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS) policies
-- Note: These are basic policies. You will want to tighten these for a production app.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.banners enable row level security;

-- Public can read active Categories, published Products, approved Reviews, and active Banners
create policy "Public can view active categories" on public.categories for select using (status = 'Active');
create policy "Public can view published products" on public.products for select using (status = 'Published');
create policy "Public can view approved reviews" on public.reviews for select using (status = 'Approved');
create policy "Public can view active banners" on public.banners for select using (status = 'Active');

-- Users can read and update their own profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Users can manage their own orders and reviews
create policy "Users can view own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders" on public.orders for insert with check (auth.uid() = user_id);
create policy "Users can view own order items" on public.order_items for select using (
  order_id in (select id from public.orders where user_id = auth.uid())
);
create policy "Users can insert own order items" on public.order_items for insert with check (
  order_id in (select id from public.orders where user_id = auth.uid())
);
create policy "Users can insert own reviews" on public.reviews for insert with check (auth.uid() = user_id);

-- Admins bypass RLS for everything (Assuming you set up an admin check function later, but for now we'll leave it as is. You can use Supabase Dashboard directly for Admin actions for now).
