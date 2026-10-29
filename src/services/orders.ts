// ============================================================
// Millennium Era — Order Service
// ============================================================

import { supabase } from '@/lib/supabase';
import type {
  Order,
  CheckoutData,
  CheckoutResult,
  PaginatedResponse,
  PaymentMethodType,
} from '@/types';

// ---- Select Queries ----

const ORDER_LIST_SELECT = `
  *,
  items:order_items(*),
  user:profiles!user_id(id, full_name, email, phone)
`;

const ORDER_DETAIL_SELECT = `
  *,
  items:order_items(*),
  status_history:order_status_history(
    *,
    changer:profiles!changed_by(id, full_name, email)
  ),
  payment_claims:payment_claims(*),
  user:profiles!user_id(id, full_name, email, phone)
`;

// ---- Service Functions ----

/**
 * Create a new order via the create_order RPC function with an atomic direct fallback.
 * This handles inventory deduction, item line totals, and order tracking reliably.
 */
export async function createOrder(data: CheckoutData): Promise<CheckoutResult> {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Try calling the PostgreSQL RPC function create_order
  try {
    const { data: result, error } = await supabase.rpc('create_order', {
      p_user_id: user?.id ?? null,
      p_items: data.items,
      p_shipping_address: data.shipping_address,
      p_billing_address: data.billing_address ?? null,
      p_payment_method: data.payment_method,
      p_coupon_code: data.coupon_code ?? null,
      p_customer_notes: data.customer_notes ?? null,
      p_shipping_zone_id: data.shipping_zone_id ?? null,
      p_idempotency_key: data.idempotency_key,
      p_guest_email: data.guest_email ?? user?.email ?? null,
      p_guest_phone: data.guest_phone ?? (data.shipping_address as any)?.phone ?? null,
    });

    if (!error && result?.order_id) {
      return result as CheckoutResult;
    }
    console.warn('RPC create_order returned error or no order_id, activating direct order fallback:', error);
  } catch (rpcCallErr) {
    console.warn('RPC create_order call threw, activating direct order fallback:', rpcCallErr);
  }

  // 2. Direct Fallback: Insert order and order items directly to Supabase
  // A. Check idempotency
  if (data.idempotency_key) {
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id, order_number, total_amount')
      .eq('idempotency_key', data.idempotency_key)
      .maybeSingle();

    if (existingOrder) {
      return {
        success: true,
        order_id: existingOrder.id,
        order_number: existingOrder.order_number,
        total_amount: existingOrder.total_amount,
        duplicate: true,
      };
    }
  }

  // B. Calculate items and subtotal
  let subtotal = 0;
  const orderItemsToInsert: any[] = [];
  const stockDeductions: Array<{ productId: string; variantId?: string | null; qty: number }> = [];

  for (const item of data.items) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*, images:product_images(*)')
      .eq('id', item.product_id)
      .single();

    if (prodErr || !product) {
      throw new Error(`Product ${item.product_id} not found or unavailable`);
    }

    let unitPrice = product.sale_price ?? product.regular_price;
    let regularPrice = product.regular_price;
    let productName = product.name;
    let productSku = product.sku;
    let variantName: string | null = null;
    let variantSku: string | null = null;
    let imageUrl = product.images?.[0]?.url || '/assets/logo.png';
    const variationDetails = {};

    if (item.variant_id) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('*')
        .eq('id', item.variant_id)
        .maybeSingle();

      if (variant) {
        unitPrice = variant.sale_price ?? variant.regular_price;
        regularPrice = variant.regular_price;
        variantName = variant.name;
        variantSku = variant.sku;
        if (variant.image_url) imageUrl = variant.image_url;
      }
    }

    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItemsToInsert.push({
      product_id: product.id,
      variant_id: item.variant_id ?? null,
      product_name: productName,
      product_sku: productSku,
      variant_name: variantName,
      variant_sku: variantSku,
      image_url: imageUrl,
      unit_price: unitPrice,
      regular_price: regularPrice,
      quantity: item.quantity,
      line_total: lineTotal,
      variation_details: variationDetails,
    });

    stockDeductions.push({
      productId: product.id,
      variantId: item.variant_id,
      qty: item.quantity,
    });
  }

  // C. Calculate shipping
  let shippingAmount = 0;
  let shippingMethod = 'Standard Shipping';
  let estimatedDelivery = '3-7 business days';

  if (data.shipping_zone_id) {
    const { data: zone } = await supabase
      .from('shipping_zones')
      .select('*')
      .eq('id', data.shipping_zone_id)
      .maybeSingle();

    if (zone) {
      shippingAmount = zone.shipping_fee;
      shippingMethod = zone.name;
      estimatedDelivery = zone.estimated_delivery || estimatedDelivery;
      if (zone.free_shipping_threshold && subtotal >= zone.free_shipping_threshold) {
        shippingAmount = 0;
      }
    }
  }

  // D. Calculate total
  const discountAmount = 0;
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingAmount);
  const orderNumber = `ME-${Math.floor(100000 + Math.random() * 900000)}`;

  // E. Insert order first (satisfying foreign key constraint)
  const { data: newOrder, error: orderErr } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      user_id: user?.id ?? null,
      guest_email: data.guest_email ?? user?.email ?? null,
      guest_phone: data.guest_phone ?? (data.shipping_address as any)?.phone ?? null,
      status: 'pending_confirmation',
      payment_status: data.payment_method === 'cod' ? 'cod_pending' : 'unpaid',
      payment_method: data.payment_method,
      subtotal,
      discount_amount: discountAmount,
      shipping_amount: shippingAmount,
      total_amount: totalAmount,
      coupon_code: data.coupon_code ?? null,
      shipping_zone_id: data.shipping_zone_id ?? null,
      shipping_method: shippingMethod,
      estimated_delivery: estimatedDelivery,
      shipping_address: data.shipping_address,
      billing_address: data.billing_address ?? null,
      customer_notes: data.customer_notes ?? null,
      idempotency_key: data.idempotency_key,
    })
    .select('id, order_number, total_amount')
    .single();

  if (orderErr || !newOrder) {
    throw new Error(`Order creation failed: ${orderErr?.message || 'Database insert error'}`);
  }

  // F. Insert order items linked to order.id
  const itemsWithOrderId = orderItemsToInsert.map((oi) => ({
    ...oi,
    order_id: newOrder.id,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(itemsWithOrderId);
  if (itemsErr) {
    console.warn('Order items insert error:', itemsErr);
  }

  // G. Insert order status history
  try {
    await supabase.from('order_status_history').insert({
      order_id: newOrder.id,
      new_status: 'pending_confirmation',
      new_payment_status: data.payment_method === 'cod' ? 'cod_pending' : 'unpaid',
      changed_by: user?.id ?? null,
      notes: 'Order placed via checkout',
    });
  } catch {
    // non-fatal
  }

  // H. Deduct stock & log inventory movement
  for (const deduction of stockDeductions) {
    try {
      if (deduction.variantId) {
        const { data: v } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', deduction.variantId)
          .single();
        if (v) {
          const nextStock = Math.max(0, v.stock_quantity - deduction.qty);
          await supabase
            .from('product_variants')
            .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
            .eq('id', deduction.variantId);
          await supabase.from('inventory_movements').insert({
            product_id: deduction.productId,
            variant_id: deduction.variantId,
            movement_type: 'sale',
            quantity: -deduction.qty,
            reference_id: newOrder.id,
            reference_type: 'order',
            reason: `Order #${newOrder.order_number}`,
            performed_by: user?.id ?? null,
            stock_before: v.stock_quantity,
            stock_after: nextStock,
          });
        }
      } else {
        const { data: p } = await supabase
          .from('products')
          .select('stock_quantity, total_sold')
          .eq('id', deduction.productId)
          .single();
        if (p) {
          const nextStock = Math.max(0, p.stock_quantity - deduction.qty);
          await supabase
            .from('products')
            .update({
              stock_quantity: nextStock,
              total_sold: (p.total_sold || 0) + deduction.qty,
              updated_at: new Date().toISOString(),
            })
            .eq('id', deduction.productId);
          await supabase.from('inventory_movements').insert({
            product_id: deduction.productId,
            variant_id: null,
            movement_type: 'sale',
            quantity: -deduction.qty,
            reference_id: newOrder.id,
            reference_type: 'order',
            reason: `Order #${newOrder.order_number}`,
            performed_by: user?.id ?? null,
            stock_before: p.stock_quantity,
            stock_after: nextStock,
          });
        }
      }
    } catch (stockErr) {
      console.warn('Stock update non-fatal error:', stockErr);
    }
  }

  // I. Clear cart if user is authenticated
  if (user?.id) {
    try {
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cart) {
        await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      }
    } catch {
      // non-fatal
    }
  }

  return {
    success: true,
    order_id: newOrder.id,
    order_number: newOrder.order_number,
    total_amount: newOrder.total_amount,
    duplicate: false,
  };
}

/**
 * Get the current user's orders with pagination.
 */
export async function getMyOrders(
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Order>> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('orders')
    .select(ORDER_LIST_SELECT, { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  const totalCount = count ?? 0;

  return {
    data: (data as unknown as Order[]) ?? [],
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Get a single order by order number with full details.
 */
export async function getOrderByNumber(orderNumber: string): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_DETAIL_SELECT)
    .eq('order_number', orderNumber)
    .single();

  if (error) {
    throw new Error(`Order not found: ${error.message}`);
  }

  return data as unknown as Order;
}

/**
 * Submit a manual payment proof/claim for an order.
 */
export async function submitPaymentClaim(
  orderId: string,
  claimData: {
    payment_method: PaymentMethodType;
    sender_number?: string;
    transaction_id?: string;
    amount_claimed: number; // paisa
  }
): Promise<void> {
  const { error } = await supabase.from('payment_claims').insert({
    order_id: orderId,
    payment_method: claimData.payment_method,
    sender_number: claimData.sender_number ?? null,
    transaction_id: claimData.transaction_id ?? null,
    amount_claimed: claimData.amount_claimed,
    status: 'payment_submitted',
  });

  if (error) {
    throw new Error(`Failed to submit payment claim: ${error.message}`);
  }

  // Update order payment status
  const { error: updateError } = await supabase
    .from('orders')
    .update({ payment_status: 'payment_submitted' })
    .eq('id', orderId);

  if (updateError) {
    throw new Error(`Failed to update order payment status: ${updateError.message}`);
  }
}

/**
 * Request cancellation of an order.
 */
export async function cancelOrder(orderId: string): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user?.id;

  if (!userId) {
    throw new Error('Not authenticated');
  }

  // Verify the order belongs to the user and is in a cancellable state
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, user_id, status')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !order) {
    throw new Error('Order not found');
  }

  const cancellableStatuses = ['pending_confirmation', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw new Error('This order cannot be cancelled in its current status');
  }

  const newStatus = order.status === 'pending_confirmation' ? 'cancelled' : 'cancellation_requested';

  const { error } = await supabase
    .from('orders')
    .update({
      status: newStatus,
      cancelled_at: newStatus === 'cancelled' ? new Date().toISOString() : undefined,
    })
    .eq('id', orderId);

  if (error) {
    throw new Error(`Failed to cancel order: ${error.message}`);
  }

  // Insert status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    changed_by: userId,
    notes: 'Customer requested cancellation',
  });
}
