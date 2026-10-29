// ============================================================
// Millennium Era — Cart Service (Server-side)
// ============================================================

import { supabase } from '@/lib/supabase';
import type { Cart, CartItem, LocalCartItem } from '@/types';

// ---- Select Queries ----

const CART_ITEM_SELECT = `
  *,
  product:products!product_id(
    id, name, slug, regular_price, sale_price, stock_quantity, status,
    images:product_images(id, url, alt_text, is_primary)
  ),
  variant:product_variants!variant_id(
    id, name, sku, regular_price, sale_price, stock_quantity, is_active, image_url
  )
`;

// ---- Helpers ----

/**
 * Get or create the cart for the current user.
 */
async function getOrCreateCartId(): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Try to find existing cart
  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    return existing.id;
  }

  // Create a new cart
  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create cart: ${error.message}`);
  }

  return newCart.id;
}

// ---- Service Functions ----

/**
 * Get the current user's server-side cart with product details.
 */
export async function getCart(): Promise<Cart | null> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    return null;
  }

  const { data: cart, error } = await supabase
    .from('carts')
    .select('id, user_id, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error || !cart) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('cart_items')
    .select(CART_ITEM_SELECT)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (itemsError) {
    throw new Error(`Failed to fetch cart items: ${itemsError.message}`);
  }

  return {
    ...cart,
    items: (items as unknown as CartItem[]) ?? [],
  } as Cart;
}

/**
 * Add a product to the cart. If the item already exists, increment quantity.
 */
export async function addToCart(
  productId: string,
  variantId: string | null,
  quantity: number = 1
): Promise<CartItem> {
  const cartId = await getOrCreateCartId();

  // Check if item already exists in cart
  let existingQuery = supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId);

  if (variantId) {
    existingQuery = existingQuery.eq('variant_id', variantId);
  } else {
    existingQuery = existingQuery.is('variant_id', null);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id)
      .select(CART_ITEM_SELECT)
      .single();

    if (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }

    return data as unknown as CartItem;
  }

  // Insert new item
  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: productId,
      variant_id: variantId,
      quantity,
    })
    .select(CART_ITEM_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to add item to cart: ${error.message}`);
  }

  return data as unknown as CartItem;
}

/**
 * Update the quantity of a cart item.
 */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number
): Promise<CartItem> {
  if (quantity <= 0) {
    await removeCartItem(itemId);
    return {} as CartItem;
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .select(CART_ITEM_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update cart item quantity: ${error.message}`);
  }

  return data as unknown as CartItem;
}

/**
 * Remove a single item from the cart.
 */
export async function removeCartItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(`Failed to remove cart item: ${error.message}`);
  }
}

/**
 * Clear all items from the user's cart.
 */
export async function clearCart(): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!cart) return;

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id);

  if (error) {
    throw new Error(`Failed to clear cart: ${error.message}`);
  }
}

/**
 * Merge guest (local) cart items into the authenticated user's server-side cart.
 * Existing items have their quantities summed; new items are added.
 */
export async function mergeGuestCart(items: LocalCartItem[]): Promise<void> {
  if (items.length === 0) return;

  const cartId = await getOrCreateCartId();

  for (const item of items) {
    let existingQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', item.productId);

    if (item.variantId) {
      existingQuery = existingQuery.eq('variant_id', item.variantId);
    } else {
      existingQuery = existingQuery.is('variant_id', null);
    }

    const { data: existing } = await existingQuery.single();

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + item.quantity })
        .eq('id', existing.id);
    } else {
      await supabase.from('cart_items').insert({
        cart_id: cartId,
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
      });
    }
  }
}
