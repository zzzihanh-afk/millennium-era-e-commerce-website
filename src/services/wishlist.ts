// ============================================================
// Millennium Era — Wishlist Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type { WishlistItem } from '@/types';

// ---- Select Queries ----

const WISHLIST_SELECT = `
  *,
  product:products!product_id(
    id, name, slug, regular_price, sale_price, stock_quantity, status,
    is_featured, average_rating, review_count,
    images:product_images(id, url, alt_text, is_primary),
    category:categories!category_id(id, name, slug)
  )
`;

// ---- Helpers ----

async function requireUserId(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  return userId;
}

// ---- Service Functions ----

/**
 * Get the current user's wishlist with product data.
 */
export async function getWishlist(): Promise<WishlistItem[]> {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('wishlists')
    .select(WISHLIST_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch wishlist: ${error.message}`);
  }

  return (data as unknown as WishlistItem[]) ?? [];
}

/**
 * Add a product to the wishlist.
 */
export async function addToWishlist(productId: string): Promise<WishlistItem> {
  const userId = await requireUserId();

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (existing) {
    throw new Error('Product is already in your wishlist');
  }

  const { data, error } = await supabase
    .from('wishlists')
    .insert({
      user_id: userId,
      product_id: productId,
    })
    .select(WISHLIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to add to wishlist: ${error.message}`);
  }

  return data as unknown as WishlistItem;
}

/**
 * Remove a product from the wishlist.
 */
export async function removeFromWishlist(productId: string): Promise<void> {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    throw new Error(`Failed to remove from wishlist: ${error.message}`);
  }
}

/**
 * Check if a product is in the user's wishlist.
 */
export async function isInWishlist(productId: string): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) return false;

  const { data, error } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .single();

  if (error) return false;

  return !!data;
}
