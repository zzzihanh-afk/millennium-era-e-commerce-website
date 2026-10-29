import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format price from paisa (integer minor units) to display string.
 * @param paisa - Price in paisa (100 paisa = 1 BDT)
 * @param options - Formatting options
 */
export function formatPrice(
  paisa: number | null | undefined,
  options: { showSymbol?: boolean; showDecimals?: boolean } = {}
): string {
  const { showSymbol = true, showDecimals = true } = options;
  if (paisa === null || paisa === undefined) return '';
  
  const bdt = paisa / 100;
  const formatted = showDecimals
    ? bdt.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(bdt).toLocaleString('en-BD');
  
  return showSymbol ? `৳${formatted}` : formatted;
}

/**
 * Parse a BDT display string back to paisa.
 */
export function parsePriceToPaisa(displayPrice: string): number {
  const cleaned = displayPrice.replace(/[৳,\s]/g, '');
  const bdt = parseFloat(cleaned);
  if (isNaN(bdt)) return 0;
  return Math.round(bdt * 100);
}

/**
 * Calculate discount percentage.
 */
export function calcDiscountPercent(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0 || salePrice >= regularPrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

/**
 * Get the effective price (sale price or regular price).
 */
export function getEffectivePrice(regularPrice: number, salePrice: number | null): number {
  return salePrice !== null && salePrice < regularPrice ? salePrice : regularPrice;
}

/**
 * Get stock status label and color.
 */
export function getStockInfo(quantity: number, lowThreshold: number = 5): {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  color: string;
} {
  if (quantity <= 0) return { status: 'out_of_stock', label: 'Out of Stock', color: 'text-red-600' };
  if (quantity <= lowThreshold) return { status: 'low_stock', label: `Only ${quantity} left`, color: 'text-orange-500' };
  return { status: 'in_stock', label: 'In Stock', color: 'text-green-600' };
}

/**
 * Generate a URL-safe slug.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique idempotency key.
 */
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format a date string.
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a date and time string.
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time (e.g., "5 min ago").
 */
export function getRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 30) return `${diffDay}d ago`;
  return formatDate(dateString);
}

/**
 * Order status display config.
 */
export const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_confirmation: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  processing: { label: 'Processing', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  packed: { label: 'Packed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped: { label: 'Shipped', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancellation_requested: { label: 'Cancel Requested', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  return_requested: { label: 'Return Requested', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  returned: { label: 'Returned', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  unpaid: { label: 'Unpaid', color: 'text-red-700', bgColor: 'bg-red-100' },
  payment_submitted: { label: 'Submitted', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  under_review: { label: 'Under Review', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  paid: { label: 'Paid', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  refunded: { label: 'Refunded', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  cod_pending: { label: 'COD Pending', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  cod_collected: { label: 'COD Collected', color: 'text-green-700', bgColor: 'bg-green-100' },
};

/**
 * Bangladesh districts list.
 */
export const BD_DISTRICTS = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Gazipur', 'Narayanganj', 'Bogra', 'Cox\'s Bazar', 'Jessore', 'Dinajpur',
  'Tangail', 'Brahmanbaria', 'Narsingdi', 'Savar', 'Tongi', 'Nawabganj', 'Jamalpur',
  'Kushtia', 'Habiganj', 'Sunamganj', 'Moulvibazar', 'Netrokona', 'Sherpur', 'Kishoreganj',
  'Madaripur', 'Gopalganj', 'Faridpur', 'Manikganj', 'Munshiganj', 'Rajbari', 'Shariatpur',
  'Bagerhat', 'Chuadanga', 'Jhenaidah', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
  'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
  'Bandarban', 'Chandpur', 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
  'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Sirajganj',
  'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon',
].sort();
