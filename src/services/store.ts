// ============================================================
// Millennium Era — Store Service (Public)
// ============================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_BANNERS } from '@/lib/demoData';
import type {
  StoreSetting,
  SocialLink,
  Banner,
  ShippingZone,
  PaymentMethodSetting,
  ContactInquiry,
  Coupon,
} from '@/types';

// Default Fallbacks so the storefront is never blank
const DEFAULT_STORE_SETTINGS: Record<string, unknown> = {
  store_name: 'Millennium Era',
  store_tagline: 'Shop Beyond Time',
  store_phone: '+880 1712 345678',
  store_email: 'info@millenniumera.com',
  store_address: '123, Main Street, Chattogram, Bangladesh',
  currency: 'BDT',
  currency_symbol: '৳',
  free_shipping_threshold: 500000, // ৳5,000.00
};

const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: 'soc-fb', platform: 'facebook', url: 'https://facebook.com/millenniumera', icon: 'facebook', display_order: 1, is_active: true, updated_at: new Date().toISOString() },
  { id: 'soc-ig', platform: 'instagram', url: 'https://instagram.com/millenniumera', icon: 'instagram', display_order: 2, is_active: true, updated_at: new Date().toISOString() },
  { id: 'soc-yt', platform: 'youtube', url: 'https://youtube.com/@millenniumera', icon: 'youtube', display_order: 3, is_active: true, updated_at: new Date().toISOString() },
  { id: 'soc-tt', platform: 'tiktok', url: 'https://tiktok.com/@millenniumera', icon: 'tiktok', display_order: 4, is_active: true, updated_at: new Date().toISOString() },
];

const DEFAULT_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'zone-inside-dhaka',
    name: 'Inside Dhaka City',
    slug: 'inside-dhaka',
    description: 'Standard delivery within Dhaka metropolitan area (24-48 hours)',
    shipping_fee: 6000, // ৳60.00
    free_shipping_threshold: 300000, // ৳3,000.00
    estimated_delivery: '1-2 Days',
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'zone-outside-dhaka',
    name: 'Outside Dhaka (Nationwide)',
    slug: 'outside-dhaka',
    description: 'Express courier across all 64 districts of Bangladesh (3-5 business days)',
    shipping_fee: 12000, // ৳120.00
    free_shipping_threshold: 500000, // ৳5,000.00
    estimated_delivery: '3-5 Days',
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEFAULT_PAYMENT_METHODS: PaymentMethodSetting[] = [
  {
    id: 'pm-cod',
    method_type: 'cod',
    display_name: 'Cash on Delivery',
    instructions: 'Pay cash upon receiving the parcel at your doorstep anywhere in Bangladesh. Please keep the exact amount ready.',
    account_number: null,
    account_type: null,
    account_label: null,
    min_order_amount: null,
    max_order_amount: null,
    additional_config: {},
    is_enabled: true,
    display_order: 1,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-bkash',
    method_type: 'bkash',
    display_name: 'bKash Merchant Payment',
    instructions: 'Send money or make payment to 01712-345679 and provide your sender mobile number and TrxID.',
    account_number: '01712-345679',
    account_type: 'merchant',
    account_label: 'bKash Merchant',
    min_order_amount: null,
    max_order_amount: null,
    additional_config: {},
    is_enabled: true,
    display_order: 2,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-nagad',
    method_type: 'nagad',
    display_name: 'Nagad Payment',
    instructions: 'Send money to 01712-345680 and enter the 8-character Transaction ID.',
    account_number: '01712-345680',
    account_type: 'merchant',
    account_label: 'Nagad Merchant',
    min_order_amount: null,
    max_order_amount: null,
    additional_config: {},
    is_enabled: true,
    display_order: 3,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'pm-rocket',
    method_type: 'rocket',
    display_name: 'Rocket (DBBL)',
    instructions: 'Send payment via Rocket and provide transaction ID for verification.',
    account_number: '01712-345681-7',
    account_type: 'merchant',
    account_label: 'Rocket Merchant',
    min_order_amount: null,
    max_order_amount: null,
    additional_config: {},
    is_enabled: true,
    display_order: 4,
    updated_at: new Date().toISOString(),
  },
];

// ---- Service Functions ----

/**
 * Get public store settings.
 */
export async function getPublicSettings(): Promise<Record<string, unknown>> {
  if (!isSupabaseConfigured) {
    return DEFAULT_STORE_SETTINGS;
  }
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('key, value')
      .eq('is_public', true);

    if (error || !data || data.length === 0) {
      return DEFAULT_STORE_SETTINGS;
    }

    const settings: Record<string, unknown> = { ...DEFAULT_STORE_SETTINGS };
    for (const row of (data as StoreSetting[]) ?? []) {
      settings[row.key] = row.value;
    }

    return settings;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

/**
 * Get active social links, ordered by display_order.
 */
export async function getSocialLinks(): Promise<SocialLink[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_SOCIAL_LINKS;
  }
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_SOCIAL_LINKS;
    }

    return data as SocialLink[];
  } catch {
    return DEFAULT_SOCIAL_LINKS;
  }
}

/**
 * Get active banners, ordered by display_order.
 */
export async function getBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) {
    return DEMO_BANNERS;
  }
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('status', 'active')
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEMO_BANNERS;
    }

    return data as Banner[];
  } catch {
    return DEMO_BANNERS;
  }
}

/**
 * Get active shipping zones with their districts.
 */
export async function getShippingZones(): Promise<ShippingZone[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_SHIPPING_ZONES;
  }
  try {
    const { data, error } = await supabase
      .from('shipping_zones')
      .select(`
        *,
        districts:shipping_zone_districts(*)
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_SHIPPING_ZONES;
    }

    return data as unknown as ShippingZone[];
  } catch {
    return DEFAULT_SHIPPING_ZONES;
  }
}

/**
 * Get enabled payment methods, ordered by display_order.
 */
export async function getPaymentMethods(): Promise<PaymentMethodSetting[]> {
  if (!isSupabaseConfigured) {
    return DEFAULT_PAYMENT_METHODS;
  }
  try {
    const { data, error } = await supabase
      .from('payment_method_settings')
      .select('*')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_PAYMENT_METHODS;
    }

    return data as PaymentMethodSetting[];
  } catch {
    return DEFAULT_PAYMENT_METHODS;
  }
}

/**
 * Subscribe an email to the newsletter.
 */
export async function subscribeNewsletter(email: string): Promise<void> {
  // Upsert to handle re-subscription
  const { error } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email: email.toLowerCase().trim(),
        is_active: true,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      },
      { onConflict: 'email' }
    );

  if (error) {
    throw new Error(`Failed to subscribe: ${error.message}`);
  }
}

/**
 * Submit a contact inquiry.
 */
export async function submitContactInquiry(
  data: Pick<ContactInquiry, 'name' | 'email' | 'phone' | 'subject' | 'message'>
): Promise<void> {
  const { error } = await supabase.from('contact_inquiries').insert({
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    subject: data.subject,
    message: data.message,
  });

  if (error) {
    throw new Error(`Failed to submit inquiry: ${error.message}`);
  }
}

/**
 * Validate a coupon code and return the coupon details if valid.
 */
export async function validateCoupon(
  code: string,
  subtotal: number // paisa
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid coupon code' };
  }

  const coupon = data as Coupon;
  const now = new Date();

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    return { valid: false, error: 'This coupon has expired' };
  }

  // Check start date
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return { valid: false, error: 'This coupon is not yet active' };
  }

  // Check usage limit
  if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
    return { valid: false, error: 'This coupon has reached its usage limit' };
  }

  // Check minimum order amount
  if (coupon.minimum_order_amount !== null && subtotal < coupon.minimum_order_amount) {
    return {
      valid: false,
      error: `Minimum order amount of ৳${(coupon.minimum_order_amount / 100).toFixed(2)} required`,
    };
  }

  return { valid: true, coupon };
}
