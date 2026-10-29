-- ============================================================
-- MILLENNIUM ERA E-COMMERCE PLATFORM
-- Complete Database Schema Migration
-- ============================================================
-- All monetary values stored as INTEGER in paisa (1 BDT = 100 paisa)
-- This prevents floating-point precision errors.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'customer',
  'support_agent',
  'inventory_manager',
  'order_manager',
  'admin',
  'super_admin'
);

CREATE TYPE product_status AS ENUM (
  'draft',
  'active',
  'archived'
);

CREATE TYPE stock_status AS ENUM (
  'in_stock',
  'low_stock',
  'out_of_stock'
);

CREATE TYPE order_status AS ENUM (
  'pending_confirmation',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancellation_requested',
  'cancelled',
  'return_requested',
  'returned'
);

CREATE TYPE payment_status AS ENUM (
  'unpaid',
  'payment_submitted',
  'under_review',
  'paid',
  'rejected',
  'refunded',
  'cod_pending',
  'cod_collected'
);

CREATE TYPE payment_method_type AS ENUM (
  'cod',
  'bkash',
  'nagad',
  'rocket',
  'gateway'
);

CREATE TYPE inventory_movement_type AS ENUM (
  'purchase',
  'sale',
  'reservation',
  'reservation_release',
  'adjustment',
  'return',
  'damaged',
  'restock',
  'initial'
);

CREATE TYPE coupon_type AS ENUM (
  'percentage',
  'fixed_amount',
  'free_shipping'
);

CREATE TYPE banner_status AS ENUM (
  'active',
  'inactive',
  'scheduled'
);

CREATE TYPE fraud_flag_status AS ENUM (
  'open',
  'under_review',
  'resolved',
  'dismissed'
);

CREATE TYPE account_status AS ENUM (
  'active',
  'suspended',
  'restricted'
);

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  account_status account_status NOT NULL DEFAULT 'active',
  suspension_reason TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_account_status ON profiles(account_status);

-- ============================================================
-- 2. ADDRESSES
-- ============================================================

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'Bangladesh',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  product_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ============================================================
-- 4. PRODUCT ATTRIBUTES (Size, Color, Material, etc.)
-- ============================================================

CREATE TABLE product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. PRODUCT ATTRIBUTE VALUES (S, M, L, Red, Blue, etc.)
-- ============================================================

CREATE TABLE product_attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  color_hex TEXT, -- For color swatches
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attribute_id, slug)
);

CREATE INDEX idx_attr_values_attribute ON product_attribute_values(attribute_id);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  short_description TEXT,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  
  -- Pricing (in paisa — integer minor units)
  regular_price INTEGER NOT NULL DEFAULT 0,
  sale_price INTEGER,
  
  -- Status
  status product_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Product type
  has_variants BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Stock (for simple products without variants)
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Shipping
  weight_grams INTEGER,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  
  -- Metrics
  view_count INTEGER NOT NULL DEFAULT 0,
  total_sold INTEGER NOT NULL DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_search ON products USING gin(
  (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(short_description, '') || ' ' || coalesce(sku, '')))
);
CREATE INDEX idx_products_price ON products(regular_price);
CREATE INDEX idx_products_sale_price ON products(sale_price) WHERE sale_price IS NOT NULL;
CREATE INDEX idx_products_created ON products(created_at DESC);

-- ============================================================
-- 7. PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ============================================================
-- 8. PRODUCT-ATTRIBUTE MAPPING (which attributes does a product use?)
-- ============================================================

CREATE TABLE product_attribute_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, attribute_id)
);

CREATE INDEX idx_pac_product ON product_attribute_configs(product_id);

-- ============================================================
-- 9. PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  name TEXT, -- e.g. "Red / M"
  
  -- Pricing (in paisa)
  regular_price INTEGER NOT NULL DEFAULT 0,
  sale_price INTEGER,
  
  -- Stock
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Physical
  weight_grams INTEGER,
  
  -- Image
  image_url TEXT,
  
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- ============================================================
-- 10. VARIANT ATTRIBUTE VALUES (links variant to specific attribute values)
-- ============================================================

CREATE TABLE variant_attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  attribute_value_id UUID NOT NULL REFERENCES product_attribute_values(id) ON DELETE CASCADE,
  UNIQUE(variant_id, attribute_id)
);

CREATE INDEX idx_vav_variant ON variant_attribute_values(variant_id);
CREATE INDEX idx_vav_value ON variant_attribute_values(attribute_value_id);

-- ============================================================
-- 11. INVENTORY MOVEMENTS (ledger)
-- ============================================================

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  movement_type inventory_movement_type NOT NULL,
  quantity INTEGER NOT NULL, -- positive for additions, negative for reductions
  reference_id UUID, -- order_id, adjustment_id, etc.
  reference_type TEXT, -- 'order', 'adjustment', 'return', etc.
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inv_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inv_movements_variant ON inventory_movements(variant_id);
CREATE INDEX idx_inv_movements_ref ON inventory_movements(reference_id);
CREATE INDEX idx_inv_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inv_movements_created ON inventory_movements(created_at DESC);

-- ============================================================
-- 12. CARTS (server-side carts for logged-in users)
-- ============================================================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT, -- For guest carts
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE UNIQUE INDEX idx_carts_user ON carts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_carts_session ON carts(session_id) WHERE session_id IS NOT NULL;

-- ============================================================
-- 13. CART ITEMS
-- ============================================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id, variant_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ============================================================
-- 14. WISHLISTS
-- ============================================================

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);

-- ============================================================
-- 15. ORDERS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Guest info (for guest checkout)
  guest_email TEXT,
  guest_phone TEXT,
  
  -- Status
  status order_status NOT NULL DEFAULT 'pending_confirmation',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  
  -- Payment
  payment_method payment_method_type NOT NULL,
  
  -- Amounts (in paisa)
  subtotal INTEGER NOT NULL,
  discount_amount INTEGER NOT NULL DEFAULT 0,
  shipping_amount INTEGER NOT NULL DEFAULT 0,
  tax_amount INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  
  -- Coupon
  coupon_id UUID,
  coupon_code TEXT,
  
  -- Shipping
  shipping_zone_id UUID,
  shipping_method TEXT,
  estimated_delivery TEXT,
  tracking_number TEXT,
  tracking_url TEXT,
  
  -- Addresses (snapshots)
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  
  -- Notes
  customer_notes TEXT,
  
  -- Idempotency
  idempotency_key TEXT UNIQUE,
  
  -- COD
  cod_amount_collected INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_idempotency ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ============================================================
-- 16. ORDER ITEMS (snapshots of product data at time of order)
-- ============================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  
  -- Snapshot fields (immutable after order creation)
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_name TEXT,
  variant_sku TEXT,
  image_url TEXT,
  
  -- Pricing snapshot (in paisa)
  unit_price INTEGER NOT NULL,
  regular_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  line_total INTEGER NOT NULL,
  
  -- Variation details snapshot
  variation_details JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- 17. ORDER STATUS HISTORY
-- ============================================================

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  old_payment_status payment_status,
  new_payment_status payment_status,
  changed_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_osh_order ON order_status_history(order_id);
CREATE INDEX idx_osh_created ON order_status_history(created_at DESC);

-- ============================================================
-- 18. PAYMENT CLAIMS (manual payment submissions)
-- ============================================================

CREATE TABLE payment_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_method payment_method_type NOT NULL,
  
  -- Customer-submitted info
  sender_number TEXT,
  transaction_id TEXT,
  amount_claimed INTEGER NOT NULL, -- paisa
  
  -- Verification
  status payment_status NOT NULL DEFAULT 'payment_submitted',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_claims_order ON payment_claims(order_id);
CREATE INDEX idx_payment_claims_status ON payment_claims(status);
CREATE INDEX idx_payment_claims_txn ON payment_claims(transaction_id);

-- ============================================================
-- 19. SHIPPING ZONES
-- ============================================================

CREATE TABLE shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  shipping_fee INTEGER NOT NULL DEFAULT 0, -- paisa
  free_shipping_threshold INTEGER, -- paisa; NULL means no free shipping
  estimated_delivery TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. SHIPPING ZONE DISTRICTS (which districts belong to which zone)
-- ============================================================

CREATE TABLE shipping_zone_districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  district_name TEXT NOT NULL,
  UNIQUE(zone_id, district_name)
);

CREATE INDEX idx_szd_zone ON shipping_zone_districts(zone_id);
CREATE INDEX idx_szd_district ON shipping_zone_districts(district_name);

-- ============================================================
-- 21. COUPONS
-- ============================================================

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  coupon_type coupon_type NOT NULL,
  value INTEGER NOT NULL, -- paisa for fixed, percentage * 100 for percent (e.g. 1000 = 10%)
  
  -- Constraints
  minimum_order_amount INTEGER, -- paisa
  maximum_discount_amount INTEGER, -- paisa (cap for percentage coupons)
  usage_limit INTEGER, -- NULL = unlimited
  usage_count INTEGER NOT NULL DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  
  -- Validity
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Restrictions
  applicable_category_ids UUID[] DEFAULT '{}',
  applicable_product_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_active ON coupons(is_active) WHERE is_active = TRUE;

-- ============================================================
-- 22. COUPON REDEMPTIONS
-- ============================================================

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  discount_amount INTEGER NOT NULL, -- paisa
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coupon_id, order_id)
);

CREATE INDEX idx_coupon_redemptions_coupon ON coupon_redemptions(coupon_id);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);

-- ============================================================
-- 23. BANNERS (hero carousel)
-- ============================================================

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT DEFAULT 'Shop Now',
  cta_url TEXT DEFAULT '/shop',
  status banner_status NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_banners_status ON banners(status);

-- ============================================================
-- 24. REVIEWS
-- ============================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  admin_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_approved ON reviews(is_approved) WHERE is_approved = TRUE;

-- ============================================================
-- 25. STORE SETTINGS (key-value)
-- ============================================================

CREATE TABLE store_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_settings_key ON store_settings(key);
CREATE INDEX idx_store_settings_category ON store_settings(category);

-- ============================================================
-- 26. PAYMENT METHOD SETTINGS
-- ============================================================

CREATE TABLE payment_method_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  method_type payment_method_type NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  instructions TEXT,
  account_type TEXT,
  account_label TEXT,
  account_number TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  min_order_amount INTEGER, -- paisa
  max_order_amount INTEGER, -- paisa
  additional_config JSONB DEFAULT '{}',
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 27. FRAUD FLAGS
-- ============================================================

CREATE TABLE fraud_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  flag_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  status fraud_flag_status NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_fraud_flags_user ON fraud_flags(user_id);
CREATE INDEX idx_fraud_flags_order ON fraud_flags(order_id);
CREATE INDEX idx_fraud_flags_status ON fraud_flags(status);
CREATE INDEX idx_fraud_flags_type ON fraud_flags(flag_type);

-- ============================================================
-- 28. RATE LIMIT EVENTS
-- ============================================================

CREATE TABLE rate_limit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  identifier TEXT NOT NULL, -- user_id, session, etc.
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_events ON rate_limit_events(identifier, event_type, created_at DESC);

-- ============================================================
-- 29. ADMIN NOTES
-- ============================================================

CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL, -- 'order', 'user', 'product', etc.
  entity_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_notes_entity ON admin_notes(entity_type, entity_id);

-- ============================================================
-- 30. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================================
-- 31. SOCIAL LINKS
-- ============================================================

CREATE TABLE social_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 32. NEWSLETTER SUBSCRIBERS
-- ============================================================

CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_email ON newsletter_subscribers(email);

-- ============================================================
-- 33. CONTACT INQUIRIES
-- ============================================================

CREATE TABLE contact_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contact_inquiries_read ON contact_inquiries(is_read);
CREATE INDEX idx_contact_inquiries_created ON contact_inquiries(created_at DESC);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_variants_updated_at BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_payment_claims_updated_at BEFORE UPDATE ON payment_claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_shipping_zones_updated_at BEFORE UPDATE ON shipping_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Auto-create profile on auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Generate order number
-- ============================================================

CREATE SEQUENCE order_number_seq START WITH 10001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ME' || nextval('order_number_seq')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Get user role helper (for RLS)
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Check if user is admin or above
-- ============================================================

CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
    AND role IN ('admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Check if user is staff (any privileged role)
-- ============================================================

CREATE OR REPLACE FUNCTION is_staff(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_uuid
    AND role IN ('support_agent', 'inventory_manager', 'order_manager', 'admin', 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- Secure checkout function (atomic order creation)
-- ============================================================

CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_items JSONB, -- [{product_id, variant_id, quantity}]
  p_shipping_address JSONB,
  p_billing_address JSONB DEFAULT NULL,
  p_payment_method payment_method_type DEFAULT 'cod',
  p_coupon_code TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_shipping_zone_id UUID DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_product RECORD;
  v_variant RECORD;
  v_unit_price INTEGER;
  v_regular_price INTEGER;
  v_stock_qty INTEGER;
  v_subtotal INTEGER := 0;
  v_discount_amount INTEGER := 0;
  v_shipping_amount INTEGER := 0;
  v_total_amount INTEGER;
  v_coupon RECORD;
  v_payment_setting RECORD;
  v_shipping_zone RECORD;
  v_image_url TEXT;
  v_variant_name TEXT;
  v_variant_sku TEXT;
  v_variation_details JSONB;
  v_stock_before INTEGER;
BEGIN
  -- 1. Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_order_id FROM orders WHERE idempotency_key = p_idempotency_key;
    IF v_order_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'order_id', v_order_id, 'duplicate', true);
    END IF;
  END IF;

  -- 2. Validate user
  IF p_user_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND account_status = 'active') THEN
      RAISE EXCEPTION 'User account is not active';
    END IF;
  END IF;

  -- 3. Validate payment method
  SELECT * INTO v_payment_setting FROM payment_method_settings
    WHERE method_type = p_payment_method AND is_enabled = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment method % is not available', p_payment_method;
  END IF;

  -- 4. Generate order
  v_order_id := uuid_generate_v4();
  v_order_number := generate_order_number();

  -- 5. Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Fetch product
    SELECT * INTO v_product FROM products
      WHERE id = (v_item->>'product_id')::UUID
      AND status = 'active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found or not active: %', v_item->>'product_id';
    END IF;

    v_variant_name := NULL;
    v_variant_sku := NULL;
    v_variation_details := '{}'::JSONB;

    IF v_product.has_variants AND v_item->>'variant_id' IS NOT NULL THEN
      -- Fetch variant
      SELECT * INTO v_variant FROM product_variants
        WHERE id = (v_item->>'variant_id')::UUID
        AND product_id = v_product.id
        AND is_active = TRUE;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'Variant not found or not active: %', v_item->>'variant_id';
      END IF;

      v_unit_price := COALESCE(v_variant.sale_price, v_variant.regular_price);
      v_regular_price := v_variant.regular_price;
      v_stock_qty := v_variant.stock_quantity;
      v_image_url := v_variant.image_url;
      v_variant_name := v_variant.name;
      v_variant_sku := v_variant.sku;

      -- Get variation details
      SELECT jsonb_object_agg(pa.display_name, pav.value) INTO v_variation_details
      FROM variant_attribute_values vav
      JOIN product_attributes pa ON pa.id = vav.attribute_id
      JOIN product_attribute_values pav ON pav.id = vav.attribute_value_id
      WHERE vav.variant_id = v_variant.id;
    ELSE
      v_unit_price := COALESCE(v_product.sale_price, v_product.regular_price);
      v_regular_price := v_product.regular_price;
      v_stock_qty := v_product.stock_quantity;
    END IF;

    -- Get primary image if not from variant
    IF v_image_url IS NULL THEN
      SELECT url INTO v_image_url FROM product_images
        WHERE product_id = v_product.id AND is_primary = TRUE LIMIT 1;
    END IF;

    -- Validate stock
    IF v_product.track_inventory AND v_stock_qty < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for product %: available %, requested %',
        v_product.name, v_stock_qty, (v_item->>'quantity')::INTEGER;
    END IF;

    -- Create order item
    INSERT INTO order_items (
      order_id, product_id, variant_id,
      product_name, product_sku, variant_name, variant_sku, image_url,
      unit_price, regular_price, quantity, line_total, variation_details
    ) VALUES (
      v_order_id, v_product.id,
      CASE WHEN v_item->>'variant_id' IS NOT NULL THEN (v_item->>'variant_id')::UUID ELSE NULL END,
      v_product.name, v_product.sku, v_variant_name, v_variant_sku, v_image_url,
      v_unit_price, v_regular_price, (v_item->>'quantity')::INTEGER,
      v_unit_price * (v_item->>'quantity')::INTEGER,
      COALESCE(v_variation_details, '{}'::JSONB)
    );

    v_subtotal := v_subtotal + (v_unit_price * (v_item->>'quantity')::INTEGER);

    -- Reserve stock
    IF v_product.track_inventory THEN
      IF v_product.has_variants AND v_item->>'variant_id' IS NOT NULL THEN
        v_stock_before := v_variant.stock_quantity;
        UPDATE product_variants
          SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
          WHERE id = v_variant.id
          AND stock_quantity >= (v_item->>'quantity')::INTEGER;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Concurrent stock conflict for variant %', v_variant.sku;
        END IF;
      ELSE
        v_stock_before := v_product.stock_quantity;
        UPDATE products
          SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
          WHERE id = v_product.id
          AND stock_quantity >= (v_item->>'quantity')::INTEGER;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Concurrent stock conflict for product %', v_product.sku;
        END IF;
      END IF;

      -- Record inventory movement
      INSERT INTO inventory_movements (
        product_id, variant_id, movement_type, quantity,
        reference_id, reference_type, reason,
        performed_by, stock_before, stock_after
      ) VALUES (
        v_product.id,
        CASE WHEN v_item->>'variant_id' IS NOT NULL THEN (v_item->>'variant_id')::UUID ELSE NULL END,
        'reservation',
        -(v_item->>'quantity')::INTEGER,
        v_order_id, 'order', 'Order reservation',
        p_user_id,
        v_stock_before,
        v_stock_before - (v_item->>'quantity')::INTEGER
      );
    END IF;

    -- Update sold count
    UPDATE products SET total_sold = total_sold + (v_item->>'quantity')::INTEGER
      WHERE id = v_product.id;
  END LOOP;

  -- 6. Apply coupon
  IF p_coupon_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM coupons
      WHERE code = UPPER(p_coupon_code)
      AND is_active = TRUE
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit);
    
    IF FOUND THEN
      -- Check minimum order
      IF v_coupon.minimum_order_amount IS NOT NULL AND v_subtotal < v_coupon.minimum_order_amount THEN
        -- Skip coupon silently (don't fail the order)
        v_coupon := NULL;
      ELSE
        -- Calculate discount
        IF v_coupon.coupon_type = 'percentage' THEN
          v_discount_amount := (v_subtotal * v_coupon.value) / 10000; -- value is percentage * 100
          IF v_coupon.maximum_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.maximum_discount_amount THEN
            v_discount_amount := v_coupon.maximum_discount_amount;
          END IF;
        ELSIF v_coupon.coupon_type = 'fixed_amount' THEN
          v_discount_amount := LEAST(v_coupon.value, v_subtotal);
        END IF;

        -- Record redemption
        INSERT INTO coupon_redemptions (coupon_id, order_id, user_id, discount_amount)
        VALUES (v_coupon.id, v_order_id, p_user_id, v_discount_amount);

        UPDATE coupons SET usage_count = usage_count + 1 WHERE id = v_coupon.id;
      END IF;
    END IF;
  END IF;

  -- 7. Calculate shipping
  IF p_shipping_zone_id IS NOT NULL THEN
    SELECT * INTO v_shipping_zone FROM shipping_zones
      WHERE id = p_shipping_zone_id AND is_active = TRUE;
    IF FOUND THEN
      v_shipping_amount := v_shipping_zone.shipping_fee;
      -- Check free shipping threshold
      IF v_shipping_zone.free_shipping_threshold IS NOT NULL
         AND (v_subtotal - v_discount_amount) >= v_shipping_zone.free_shipping_threshold THEN
        v_shipping_amount := 0;
      END IF;
      -- Check free shipping coupon
      IF v_coupon IS NOT NULL AND v_coupon.coupon_type = 'free_shipping' THEN
        v_shipping_amount := 0;
      END IF;
    END IF;
  END IF;

  -- 8. Calculate total
  v_total_amount := v_subtotal - v_discount_amount + v_shipping_amount;
  IF v_total_amount < 0 THEN v_total_amount := 0; END IF;

  -- 9. Validate order amount against payment method limits
  IF v_payment_setting.min_order_amount IS NOT NULL AND v_total_amount < v_payment_setting.min_order_amount THEN
    RAISE EXCEPTION 'Order total below minimum for payment method %', p_payment_method;
  END IF;
  IF v_payment_setting.max_order_amount IS NOT NULL AND v_total_amount > v_payment_setting.max_order_amount THEN
    RAISE EXCEPTION 'Order total exceeds maximum for payment method %', p_payment_method;
  END IF;

  -- 10. Create order
  INSERT INTO orders (
    id, order_number, user_id,
    guest_email, guest_phone,
    status, payment_status, payment_method,
    subtotal, discount_amount, shipping_amount, total_amount,
    coupon_id, coupon_code,
    shipping_zone_id, shipping_method,
    estimated_delivery,
    shipping_address, billing_address,
    customer_notes, idempotency_key
  ) VALUES (
    v_order_id, v_order_number, p_user_id,
    p_guest_email, p_guest_phone,
    'pending_confirmation',
    CASE WHEN p_payment_method = 'cod' THEN 'cod_pending' ELSE 'unpaid' END,
    p_payment_method,
    v_subtotal, v_discount_amount, v_shipping_amount, v_total_amount,
    CASE WHEN v_coupon IS NOT NULL THEN v_coupon.id ELSE NULL END,
    p_coupon_code,
    p_shipping_zone_id, COALESCE(v_shipping_zone.name, 'Standard'),
    COALESCE(v_shipping_zone.estimated_delivery, '3-7 business days'),
    p_shipping_address, p_billing_address,
    p_customer_notes, p_idempotency_key
  );

  -- 11. Record initial status
  INSERT INTO order_status_history (
    order_id, new_status, new_payment_status, changed_by, notes
  ) VALUES (
    v_order_id, 'pending_confirmation',
    CASE WHEN p_payment_method = 'cod' THEN 'cod_pending'::payment_status ELSE 'unpaid'::payment_status END,
    p_user_id, 'Order created'
  );

  -- 12. Clear cart
  IF p_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = p_user_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount,
    'duplicate', false
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Release stock for cancelled/expired orders
-- ============================================================

CREATE OR REPLACE FUNCTION release_order_stock(p_order_id UUID, p_performed_by UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_item RECORD;
  v_stock_before INTEGER;
BEGIN
  FOR v_item IN
    SELECT oi.*, p.has_variants, p.track_inventory
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = p_order_id
  LOOP
    IF v_item.track_inventory THEN
      IF v_item.variant_id IS NOT NULL THEN
        SELECT stock_quantity INTO v_stock_before FROM product_variants WHERE id = v_item.variant_id;
        UPDATE product_variants
          SET stock_quantity = stock_quantity + v_item.quantity
          WHERE id = v_item.variant_id;
      ELSE
        SELECT stock_quantity INTO v_stock_before FROM products WHERE id = v_item.product_id;
        UPDATE products
          SET stock_quantity = stock_quantity + v_item.quantity
          WHERE id = v_item.product_id;
      END IF;

      INSERT INTO inventory_movements (
        product_id, variant_id, movement_type, quantity,
        reference_id, reference_type, reason,
        performed_by, stock_before, stock_after
      ) VALUES (
        v_item.product_id, v_item.variant_id,
        'reservation_release', v_item.quantity,
        p_order_id, 'order', 'Order cancelled/expired - stock released',
        p_performed_by,
        COALESCE(v_stock_before, 0),
        COALESCE(v_stock_before, 0) + v_item.quantity
      );
    END IF;

    -- Reverse sold count
    UPDATE products SET total_sold = GREATEST(total_sold - v_item.quantity, 0)
      WHERE id = v_item.product_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_zone_districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES RLS
-- ============================================================

CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- Cannot change own role
  );

CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE USING (is_admin(auth.uid()))
  WITH CHECK (
    -- Super admin can change roles, but not self-escalate
    CASE
      WHEN auth.uid() = id THEN role = (SELECT role FROM profiles WHERE id = auth.uid())
      ELSE TRUE
    END
  );

CREATE POLICY profiles_admin_select ON profiles
  FOR SELECT USING (is_staff(auth.uid()));

-- ============================================================
-- ADDRESSES RLS
-- ============================================================

CREATE POLICY addresses_own ON addresses
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY addresses_staff_view ON addresses
  FOR SELECT USING (is_staff(auth.uid()));

-- ============================================================
-- CATEGORIES RLS (public read, admin write)
-- ============================================================

CREATE POLICY categories_public_read ON categories
  FOR SELECT USING (TRUE);

CREATE POLICY categories_admin_write ON categories
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCTS RLS (public read active, admin write)
-- ============================================================

CREATE POLICY products_public_read ON products
  FOR SELECT USING (status = 'active' OR is_staff(auth.uid()));

CREATE POLICY products_admin_write ON products
  FOR INSERT WITH CHECK (is_admin(auth.uid()) OR is_staff(auth.uid()));

CREATE POLICY products_admin_update ON products
  FOR UPDATE USING (is_admin(auth.uid()) OR is_staff(auth.uid()));

CREATE POLICY products_admin_delete ON products
  FOR DELETE USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCT IMAGES RLS
-- ============================================================

CREATE POLICY product_images_public_read ON product_images
  FOR SELECT USING (TRUE);

CREATE POLICY product_images_admin_write ON product_images
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- PRODUCT ATTRIBUTES RLS
-- ============================================================

CREATE POLICY product_attributes_public_read ON product_attributes
  FOR SELECT USING (TRUE);

CREATE POLICY product_attributes_admin_write ON product_attributes
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCT ATTRIBUTE VALUES RLS
-- ============================================================

CREATE POLICY product_attribute_values_public_read ON product_attribute_values
  FOR SELECT USING (TRUE);

CREATE POLICY product_attribute_values_admin_write ON product_attribute_values
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCT ATTRIBUTE CONFIGS RLS
-- ============================================================

CREATE POLICY pac_public_read ON product_attribute_configs
  FOR SELECT USING (TRUE);

CREATE POLICY pac_admin_write ON product_attribute_configs
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PRODUCT VARIANTS RLS
-- ============================================================

CREATE POLICY variants_public_read ON product_variants
  FOR SELECT USING (TRUE);

CREATE POLICY variants_admin_write ON product_variants
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- VARIANT ATTRIBUTE VALUES RLS
-- ============================================================

CREATE POLICY vav_public_read ON variant_attribute_values
  FOR SELECT USING (TRUE);

CREATE POLICY vav_admin_write ON variant_attribute_values
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- INVENTORY MOVEMENTS RLS
-- ============================================================

CREATE POLICY inv_movements_staff_read ON inventory_movements
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY inv_movements_staff_write ON inventory_movements
  FOR INSERT WITH CHECK (is_staff(auth.uid()));

-- ============================================================
-- CARTS RLS
-- ============================================================

CREATE POLICY carts_own ON carts
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- CART ITEMS RLS
-- ============================================================

CREATE POLICY cart_items_own ON cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- ============================================================
-- WISHLIST RLS
-- ============================================================

CREATE POLICY wishlist_own ON wishlist_items
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- ORDERS RLS
-- ============================================================

CREATE POLICY orders_own_read ON orders
  FOR SELECT USING (user_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY orders_staff_write ON orders
  FOR UPDATE USING (is_staff(auth.uid()));

CREATE POLICY orders_insert ON orders
  FOR INSERT WITH CHECK (user_id = auth.uid() OR is_staff(auth.uid()));

-- ============================================================
-- ORDER ITEMS RLS
-- ============================================================

CREATE POLICY order_items_own_read ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR is_staff(auth.uid())
  );

CREATE POLICY order_items_insert ON order_items
  FOR INSERT WITH CHECK (is_staff(auth.uid()) OR TRUE);

-- ============================================================
-- ORDER STATUS HISTORY RLS
-- ============================================================

CREATE POLICY osh_own_read ON order_status_history
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR is_staff(auth.uid())
  );

CREATE POLICY osh_staff_write ON order_status_history
  FOR INSERT WITH CHECK (is_staff(auth.uid()));

-- ============================================================
-- PAYMENT CLAIMS RLS
-- ============================================================

CREATE POLICY payment_claims_own ON payment_claims
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    OR is_staff(auth.uid())
  );

CREATE POLICY payment_claims_create ON payment_claims
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );

CREATE POLICY payment_claims_staff_update ON payment_claims
  FOR UPDATE USING (is_staff(auth.uid()));

-- ============================================================
-- SHIPPING ZONES RLS (public read, admin write)
-- ============================================================

CREATE POLICY shipping_zones_public_read ON shipping_zones
  FOR SELECT USING (TRUE);

CREATE POLICY shipping_zones_admin_write ON shipping_zones
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY szd_public_read ON shipping_zone_districts
  FOR SELECT USING (TRUE);

CREATE POLICY szd_admin_write ON shipping_zone_districts
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- COUPONS RLS
-- ============================================================

CREATE POLICY coupons_public_read ON coupons
  FOR SELECT USING (is_active = TRUE OR is_staff(auth.uid()));

CREATE POLICY coupons_admin_write ON coupons
  FOR ALL USING (is_admin(auth.uid()));

CREATE POLICY coupon_redemptions_own ON coupon_redemptions
  FOR SELECT USING (user_id = auth.uid() OR is_staff(auth.uid()));

-- ============================================================
-- BANNERS RLS (public read active, admin write)
-- ============================================================

CREATE POLICY banners_public_read ON banners
  FOR SELECT USING (status = 'active' OR is_staff(auth.uid()));

CREATE POLICY banners_admin_write ON banners
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- REVIEWS RLS
-- ============================================================

CREATE POLICY reviews_public_read ON reviews
  FOR SELECT USING (is_approved = TRUE OR user_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY reviews_own_write ON reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_own_update ON reviews
  FOR UPDATE USING (user_id = auth.uid() OR is_staff(auth.uid()));

CREATE POLICY reviews_admin_delete ON reviews
  FOR DELETE USING (is_admin(auth.uid()));

-- ============================================================
-- STORE SETTINGS RLS
-- ============================================================

CREATE POLICY store_settings_public_read ON store_settings
  FOR SELECT USING (is_public = TRUE OR is_admin(auth.uid()));

CREATE POLICY store_settings_admin_write ON store_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- PAYMENT METHOD SETTINGS RLS
-- ============================================================

CREATE POLICY pms_public_read ON payment_method_settings
  FOR SELECT USING (is_enabled = TRUE OR is_staff(auth.uid()));

CREATE POLICY pms_admin_write ON payment_method_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- FRAUD FLAGS RLS (staff only)
-- ============================================================

CREATE POLICY fraud_flags_staff ON fraud_flags
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- RATE LIMIT EVENTS RLS (staff only)
-- ============================================================

CREATE POLICY rate_limit_staff ON rate_limit_events
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- ADMIN NOTES RLS (staff only)
-- ============================================================

CREATE POLICY admin_notes_staff ON admin_notes
  FOR ALL USING (is_staff(auth.uid()));

-- ============================================================
-- AUDIT LOGS RLS (admin only)
-- ============================================================

CREATE POLICY audit_logs_admin ON audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- SOCIAL LINKS RLS (public read, admin write)
-- ============================================================

CREATE POLICY social_links_public_read ON social_links
  FOR SELECT USING (TRUE);

CREATE POLICY social_links_admin_write ON social_links
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- NEWSLETTER SUBSCRIBERS RLS
-- ============================================================

CREATE POLICY newsletter_insert ON newsletter_subscribers
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY newsletter_admin ON newsletter_subscribers
  FOR ALL USING (is_admin(auth.uid()));

-- ============================================================
-- CONTACT INQUIRIES RLS
-- ============================================================

CREATE POLICY contact_insert ON contact_inquiries
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY contact_admin ON contact_inquiries
  FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY contact_admin_update ON contact_inquiries
  FOR UPDATE USING (is_staff(auth.uid()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES
  ('product-images', 'product-images', TRUE),
  ('category-images', 'category-images', TRUE),
  ('homepage-banners', 'homepage-banners', TRUE),
  ('brand-assets', 'brand-assets', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read
CREATE POLICY storage_public_read ON storage.objects
  FOR SELECT USING (bucket_id IN ('product-images', 'category-images', 'homepage-banners', 'brand-assets'));

-- Storage policies: staff upload
CREATE POLICY storage_staff_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('product-images', 'category-images', 'homepage-banners', 'brand-assets')
    AND is_staff(auth.uid())
  );

CREATE POLICY storage_staff_update ON storage.objects
  FOR UPDATE USING (
    bucket_id IN ('product-images', 'category-images', 'homepage-banners', 'brand-assets')
    AND is_staff(auth.uid())
  );

CREATE POLICY storage_staff_delete ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('product-images', 'category-images', 'homepage-banners', 'brand-assets')
    AND is_staff(auth.uid())
  );
