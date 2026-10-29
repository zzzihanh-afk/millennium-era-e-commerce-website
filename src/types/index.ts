// ============================================================
// Millennium Era — TypeScript Type Definitions
// All monetary values are integers in paisa (1 BDT = 100 paisa)
// ============================================================

// ---- Enums ----

export type UserRole = 'customer' | 'support_agent' | 'inventory_manager' | 'order_manager' | 'admin' | 'super_admin';
export type ProductStatus = 'draft' | 'active' | 'archived';
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';
export type OrderStatus = 'pending_confirmation' | 'confirmed' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancellation_requested' | 'cancelled' | 'return_requested' | 'returned';
export type PaymentStatus = 'unpaid' | 'payment_submitted' | 'under_review' | 'paid' | 'rejected' | 'refunded' | 'cod_pending' | 'cod_collected';
export type PaymentMethodType = 'cod' | 'bkash' | 'nagad' | 'rocket' | 'gateway';
export type InventoryMovementType = 'purchase' | 'sale' | 'reservation' | 'reservation_release' | 'adjustment' | 'return' | 'damaged' | 'restock' | 'initial';
export type CouponType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type BannerStatus = 'active' | 'inactive' | 'scheduled';
export type FraudFlagStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type AccountStatus = 'active' | 'suspended' | 'restricted';

// ---- Database Models ----

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
  suspension_reason: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  assigned_tasks?: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string;
  postal_code: string | null;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  icon: string | null;
  parent_id: string | null;
  display_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  product_count: number;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category_id: string | null;
  short_description: string | null;
  description: string | null;
  specifications: Record<string, string>;
  regular_price: number; // paisa
  sale_price: number | null; // paisa
  status: ProductStatus;
  is_featured: boolean;
  has_variants: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  weight_grams: number | null;
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
  total_sold: number;
  average_rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  // Relations
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
  attribute_configs?: ProductAttributeConfig[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  display_order: number;
  created_at: string;
  values?: ProductAttributeValue[];
}

export interface ProductAttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  slug: string;
  display_order: number;
  color_hex: string | null;
  created_at: string;
}

export interface ProductAttributeConfig {
  id: string;
  product_id: string;
  attribute_id: string;
  display_order: number;
  attribute?: ProductAttribute;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string | null;
  regular_price: number; // paisa
  sale_price: number | null; // paisa
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  weight_grams: number | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  attribute_values?: VariantAttributeValue[];
}

export interface VariantAttributeValue {
  id: string;
  variant_id: string;
  attribute_id: string;
  attribute_value_id: string;
  attribute?: ProductAttribute;
  attribute_value?: ProductAttributeValue;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: InventoryMovementType;
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  reason: string | null;
  performed_by: string | null;
  stock_before: number;
  stock_after: number;
  created_at: string;
  performer?: Profile;
}

// ---- Cart ----

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  user_id: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

// Local cart for guest users
export interface LocalCartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  // Cached display data (revalidated before checkout)
  productName: string;
  variantName: string | null;
  unitPrice: number; // paisa
  regularPrice: number; // paisa
  imageUrl: string | null;
  maxQuantity: number;
}

// ---- Wishlist ----

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// ---- Orders ----

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: PaymentMethodType;
  subtotal: number; // paisa
  discount_amount: number; // paisa
  shipping_amount: number; // paisa
  tax_amount: number; // paisa
  total_amount: number; // paisa
  coupon_id: string | null;
  coupon_code: string | null;
  shipping_zone_id: string | null;
  shipping_method: string | null;
  estimated_delivery: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_address: AddressSnapshot;
  billing_address: AddressSnapshot | null;
  customer_notes: string | null;
  idempotency_key: string | null;
  cod_amount_collected: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  // Relations
  items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  payment_claims?: PaymentClaim[];
  user?: Profile;
}

export interface AddressSnapshot {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  district: string;
  postal_code?: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  product_sku: string | null;
  variant_name: string | null;
  variant_sku: string | null;
  image_url: string | null;
  unit_price: number; // paisa
  regular_price: number; // paisa
  quantity: number;
  line_total: number; // paisa
  variation_details: Record<string, string>;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  old_payment_status: PaymentStatus | null;
  new_payment_status: PaymentStatus | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  changer?: Profile;
}

// ---- Payments ----

export interface PaymentClaim {
  id: string;
  order_id: string;
  payment_method: PaymentMethodType;
  sender_number: string | null;
  transaction_id: string | null;
  amount_claimed: number; // paisa
  status: PaymentStatus;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethodSetting {
  id: string;
  method_type: PaymentMethodType;
  display_name: string;
  is_enabled: boolean;
  instructions: string | null;
  account_type: string | null;
  account_label: string | null;
  account_number: string | null;
  display_order: number;
  min_order_amount: number | null; // paisa
  max_order_amount: number | null; // paisa
  additional_config: Record<string, unknown>;
  updated_at: string;
}

// ---- Shipping ----

export interface ShippingZone {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shipping_fee: number; // paisa
  free_shipping_threshold: number | null; // paisa
  estimated_delivery: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  districts?: ShippingZoneDistrict[];
}

export interface ShippingZoneDistrict {
  id: string;
  zone_id: string;
  district_name: string;
}

// ---- Coupons ----

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  coupon_type: CouponType;
  value: number; // paisa for fixed, percentage * 100 for percent
  minimum_order_amount: number | null; // paisa
  maximum_discount_amount: number | null; // paisa
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  applicable_category_ids: string[];
  applicable_product_ids: string[];
  created_at: string;
  updated_at: string;
}

// ---- Banners ----

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string;
  cta_text: string;
  cta_url: string;
  status: BannerStatus;
  display_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Reviews ----

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
  user?: Profile;
}

// ---- Store Settings ----

export interface StoreSetting {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
}

// ---- Fraud ----

export interface FraudFlag {
  id: string;
  user_id: string | null;
  order_id: string | null;
  flag_type: string;
  description: string;
  severity: string;
  status: FraudFlagStatus;
  resolved_by: string | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
}

// ---- Admin Notes ----

export interface AdminNote {
  id: string;
  entity_type: string;
  entity_id: string;
  note: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: Profile;
}

// ---- Audit Logs ----

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: Profile;
}

// ---- Social Links ----

export interface SocialLink {
  id: string;
  platform: string;
  title?: string;
  url: string;
  icon?: string | null;
  display_order: number;
  is_active: boolean;
  updated_at?: string;
}

// ---- Newsletter ----

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
}

// ---- Contact ----

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  replied_at: string | null;
  created_at: string;
}

// ---- Pagination ----

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ---- Checkout ----

export interface CheckoutData {
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
  }>;
  shipping_address: AddressSnapshot;
  billing_address?: AddressSnapshot;
  payment_method: PaymentMethodType;
  coupon_code?: string;
  customer_notes?: string;
  shipping_zone_id?: string;
  idempotency_key: string;
  guest_email?: string;
  guest_phone?: string;
}

export interface CheckoutResult {
  success: boolean;
  order_id: string;
  order_number: string;
  total_amount: number;
  duplicate: boolean;
}

// ---- Dashboard Metrics ----

export interface DashboardMetrics {
  totalOrders: number;
  totalSales: number; // paisa
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentOrders: Order[];
  salesByPaymentMethod: Array<{ method: string; total: number; percentage: number }>;
  salesByCategory: Array<{ category: string; total: number; percentage: number }>;
  lowStockItems: Array<{ product: Product; variant?: ProductVariant; stock: number }>;
}

// ---- Permission Matrix ----

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  customer: [],
  support_agent: ['orders.view', 'orders.update_status', 'customers.view', 'admin_notes.manage', 'reviews.moderate'],
  inventory_manager: ['products.view', 'products.manage', 'inventory.manage', 'categories.view'],
  order_manager: ['orders.view', 'orders.manage', 'payments.view', 'payments.verify', 'shipping.view', 'customers.view', 'admin_notes.manage'],
  admin: [
    'dashboard.view', 'products.view', 'products.manage', 'categories.manage',
    'orders.view', 'orders.manage', 'payments.view', 'payments.verify',
    'inventory.manage', 'customers.view', 'customers.manage',
    'settings.view', 'settings.manage', 'banners.manage', 'coupons.manage',
    'shipping.manage', 'reviews.moderate', 'admin_notes.manage',
    'fraud.view', 'fraud.manage', 'audit.view',
  ],
  super_admin: [
    'dashboard.view', 'products.view', 'products.manage', 'categories.manage',
    'orders.view', 'orders.manage', 'payments.view', 'payments.verify',
    'inventory.manage', 'customers.view', 'customers.manage',
    'settings.view', 'settings.manage', 'banners.manage', 'coupons.manage',
    'shipping.manage', 'reviews.moderate', 'admin_notes.manage',
    'fraud.view', 'fraud.manage', 'audit.view',
    'staff.manage', 'roles.manage',
  ],
};

export interface StaffTaskDefinition {
  id: string;
  name: string;
  description: string;
  category: 'Orders & Payments' | 'Catalog & Inventory' | 'Customers & Support' | 'Marketing' | 'Security';
  permissions: string[];
}

export const STAFF_TASKS: StaffTaskDefinition[] = [
  {
    id: 'orders_fulfillment',
    name: 'Order Fulfillment & Dispatch',
    description: 'Process orders, print invoices, update shipping statuses (Confirmed, Packed, Shipped, Delivered)',
    category: 'Orders & Payments',
    permissions: ['orders.view', 'orders.manage', 'shipping.view'],
  },
  {
    id: 'payment_verification',
    name: 'bKash / Nagad / Rocket Verification',
    description: 'Verify customer mobile money transaction claims (TrxID) and confirm COD settlements',
    category: 'Orders & Payments',
    permissions: ['payments.view', 'payments.verify'],
  },
  {
    id: 'catalog_management',
    name: 'Product & Catalog Management',
    description: 'Create, update, and categorize products, attributes, variants, and pricing',
    category: 'Catalog & Inventory',
    permissions: ['products.view', 'products.manage', 'categories.manage'],
  },
  {
    id: 'inventory_control',
    name: 'Stock & Inventory Control',
    description: 'Perform stock adjustments, restock alerts, view inventory movement ledger',
    category: 'Catalog & Inventory',
    permissions: ['inventory.manage', 'products.view'],
  },
  {
    id: 'customer_support',
    name: 'Customer Service & Inquiries',
    description: 'View customer accounts, respond to inquiries, moderate product reviews and ratings',
    category: 'Customers & Support',
    permissions: ['customers.view', 'admin_notes.manage', 'reviews.moderate'],
  },
  {
    id: 'marketing_promotions',
    name: 'Promotions, Coupons & Banners',
    description: 'Create discount coupon codes, campaign countdowns, and homepage promotional slides',
    category: 'Marketing',
    permissions: ['banners.manage', 'coupons.manage'],
  },
  {
    id: 'fraud_monitoring',
    name: 'Fraud & Fake Order Monitoring',
    description: 'Monitor high-risk customer flags, IP velocity rate limits, blacklist suspicious phones',
    category: 'Security',
    permissions: ['fraud.view', 'fraud.manage', 'audit.view'],
  },
  {
    id: 'store_settings',
    name: 'Store Policies & Shipping Zones',
    description: 'Update delivery fees, hotline numbers, district zones, and store policies',
    category: 'Security',
    permissions: ['settings.view', 'settings.manage', 'shipping.manage'],
  },
  {
    id: 'manage_staff',
    name: 'Staff & Role Delegation',
    description: 'Create sub-administrators, designate operational duties, and revoke permissions',
    category: 'Security',
    permissions: ['staff.manage', 'roles.manage'],
  },
];

export function hasPermission(
  role: UserRole,
  permission: string,
  customPermissions?: string[]
): boolean {
  if (role === 'super_admin') return true;
  if (customPermissions?.includes('*') || customPermissions?.includes(permission)) return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isStaffRole(role: UserRole): boolean {
  return role !== 'customer';
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin' || role === 'super_admin';
}

// ---- Order Status Transitions ----

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancellation_requested', 'cancelled'],
  processing: ['packed', 'cancellation_requested', 'cancelled'],
  packed: ['shipped', 'cancellation_requested'],
  shipped: ['delivered', 'return_requested'],
  delivered: ['return_requested'],
  cancellation_requested: ['cancelled', 'processing'],
  cancelled: [],
  return_requested: ['returned', 'delivered'],
  returned: [],
};

export function canTransitionTo(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

