-- =========================================================================
-- AFFORX / AANYA FASHIONS — PRODUCTION CORE MIGRATION
-- Migration: 001_production_core.sql
-- Adds: addresses, product_variants, product_images, order_status_history,
--       inventory_transactions, coupon_redemptions, full-text search,
--       atomic stock deduction functions (RPC), and strict RLS policies.
-- =========================================================================

-- 1. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'India' NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- When an address is set as default, unset default on previous addresses for that user
CREATE OR REPLACE FUNCTION public.set_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE public.addresses
    SET is_default = FALSE
    WHERE user_id = NEW.user_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_address ON public.addresses;
CREATE TRIGGER trg_set_default_address
  BEFORE INSERT OR UPDATE OF is_default ON public.addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION public.set_default_address();

-- 2. PRODUCT VARIANTS TABLE
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  size TEXT NOT NULL,
  color TEXT,
  price_override NUMERIC(10, 2),
  stock_quantity INTEGER DEFAULT 10 NOT NULL CHECK (stock_quantity >= 0),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Out of Stock')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(product_id, size, color)
);

-- 3. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ORDER STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. INVENTORY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  change_qty INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('purchase', 'cancellation', 'restock', 'manual_adjustment', 'return')),
  reference_id TEXT, -- e.g. order_id or admin_id
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. COUPON REDEMPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  discount_applied NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(coupon_id, order_id)
);

-- 7. ATOMIC INVENTORY DEDUCTION (RPC FUNCTION)
-- Prevents race conditions and overselling under high concurrency
CREATE OR REPLACE FUNCTION public.decrement_stock(p_product_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
DECLARE
  v_current_stock INTEGER;
BEGIN
  -- Perform atomic update with condition
  UPDATE public.products
  SET stock_quantity = stock_quantity - p_qty,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id AND stock_quantity >= p_qty
  RETURNING stock_quantity INTO v_current_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Item is no longer available in the requested quantity.';
  END IF;

  -- Record audit trail
  INSERT INTO public.inventory_transactions (product_id, change_qty, reason)
  VALUES (p_product_id, -p_qty, 'purchase');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Variant Stock Deduction
CREATE OR REPLACE FUNCTION public.decrement_variant_stock(p_variant_id UUID, p_qty INTEGER)
RETURNS VOID AS $$
DECLARE
  v_product_id UUID;
  v_current_stock INTEGER;
BEGIN
  UPDATE public.product_variants
  SET stock_quantity = stock_quantity - p_qty,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_variant_id AND stock_quantity >= p_qty
  RETURNING product_id, stock_quantity INTO v_product_id, v_current_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK: Selected size/variant is out of stock.';
  END IF;

  INSERT INTO public.inventory_transactions (product_id, variant_id, change_qty, reason)
  VALUES (v_product_id, p_variant_id, -p_qty, 'purchase');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic Stock Restoration (for order cancellations/returns)
CREATE OR REPLACE FUNCTION public.restore_stock(p_product_id UUID, p_qty INTEGER, p_reason TEXT DEFAULT 'cancellation')
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = stock_quantity + p_qty,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;

  INSERT INTO public.inventory_transactions (product_id, change_qty, reason)
  VALUES (p_product_id, p_qty, p_reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. POSTGRES FULL-TEXT SEARCH VECTOR ON PRODUCTS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.products_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search ON public.products;
CREATE TRIGGER trg_products_search
  BEFORE INSERT OR UPDATE OF name, category, description ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.products_search_trigger();

-- Initialize search_vector for existing records
UPDATE public.products
SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
WHERE search_vector IS NULL;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Addresses: Users can CRUD only their own addresses
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Product variants & images: Public read, admin write
DROP POLICY IF EXISTS "Public can view product variants" ON public.product_variants;
CREATE POLICY "Public can view product variants" ON public.product_variants
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can view product images" ON public.product_images;
CREATE POLICY "Public can view product images" ON public.product_images
  FOR SELECT TO public USING (true);

-- Order status history: User can view history for their own orders
DROP POLICY IF EXISTS "Users can view history of own orders" ON public.order_status_history;
CREATE POLICY "Users can view history of own orders" ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_status_history.order_id
      AND o.user_id = auth.uid()
    )
  );
