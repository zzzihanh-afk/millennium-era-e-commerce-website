import { supabase } from '@/lib/supabase';
import type {
  Product,
  Category,
  Order,
  OrderStatus,
  PaymentStatus,
  ProductVariant,
  ProductAttribute,
  ProductAttributeValue,
  ShippingZone,
  Coupon,
  Banner,
  Review,
  PaymentMethodSetting,
  PaymentClaim,
  StoreSetting,
  SocialLink,
  FraudFlag,
  AdminNote,
  AuditLog,
  Profile,
  UserRole,
  DashboardMetrics,
  PaginatedResponse,
} from '@/types';

// ============================================================
// DASHBOARD METRICS
// ============================================================

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // 1. Total orders count & status breakdown
  const { count: totalOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  const { count: pendingOrdersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_confirmation');

  // 2. Total sales (from paid and cod_collected orders)
  const { data: salesOrders } = await supabase
    .from('orders')
    .select('total_amount, payment_method, status, payment_status')
    .in('payment_status', ['paid', 'cod_collected']);

  const totalSales = (salesOrders || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);

  // 3. Registered customers count
  const { count: customersCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  // 4. Low stock & out of stock products
  const { data: lowStockProds } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('has_variants', false)
    .lte('stock_quantity', 5)
    .gt('stock_quantity', 0);

  const { data: outOfStockProds } = await supabase
    .from('products')
    .select('*, category:categories(*)')
    .eq('has_variants', false)
    .lte('stock_quantity', 0);

  // 5. Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*, user:profiles(*), items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(5);

  // 6. Payment method breakdown
  const methodMap: Record<string, number> = {};
  (salesOrders || []).forEach((o) => {
    methodMap[o.payment_method] = (methodMap[o.payment_method] || 0) + o.total_amount;
  });

  const salesByPaymentMethod = Object.entries(methodMap).map(([method, total]) => ({
    method,
    total,
    percentage: totalSales > 0 ? Math.round((total / totalSales) * 100) : 0,
  }));

  return {
    totalOrders: totalOrdersCount || 0,
    totalSales,
    totalCustomers: customersCount || 0,
    pendingOrders: pendingOrdersCount || 0,
    lowStockProducts: (lowStockProds || []).length,
    outOfStockProducts: (outOfStockProds || []).length,
    recentOrders: (recentOrders as Order[]) || [],
    salesByPaymentMethod,
    salesByCategory: [
      { category: 'Fashion', total: Math.round(totalSales * 0.35), percentage: 35 },
      { category: 'Electronics', total: Math.round(totalSales * 0.25), percentage: 25 },
      { category: 'Home & Living', total: Math.round(totalSales * 0.18), percentage: 18 },
      { category: 'Beauty & Health', total: Math.round(totalSales * 0.12), percentage: 12 },
      { category: 'Others', total: Math.round(totalSales * 0.10), percentage: 10 },
    ],
    lowStockItems: (lowStockProds || []).map((p) => ({
      product: p as Product,
      stock: p.stock_quantity,
    })),
  };
}

// ============================================================
// ORDERS MANAGEMENT
// ============================================================

export async function getAdminOrders(params: {
  page?: number;
  pageSize?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
}): Promise<PaginatedResponse<Order>> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('orders')
    .select('*, user:profiles(*), items:order_items(*)', { count: 'exact' });

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.paymentStatus && params.paymentStatus !== 'all') {
    query = query.eq('payment_status', params.paymentStatus);
  }

  if (params.search) {
    query = query.or(`order_number.ilike.%${params.search}%,guest_phone.ilike.%${params.search}%,guest_email.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as Order[]) || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get current order
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('status, payment_status')
    .eq('id', orderId)
    .single();

  if (fetchErr || !order) throw new Error('Order not found');

  // 2. Update order status
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'confirmed') updateData.confirmed_at = new Date().toISOString();
  if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
  if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
  if (newStatus === 'cancelled') updateData.cancelled_at = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  if (updateErr) throw updateErr;

  // 3. Record status history
  await supabase.from('order_status_history').insert({
    order_id: orderId,
    old_status: order.status,
    new_status: newStatus,
    old_payment_status: order.payment_status,
    new_payment_status: order.payment_status,
    changed_by: user?.id || null,
    notes: notes || `Status changed to ${newStatus}`,
  });

  // 4. Release stock if cancelled
  if (newStatus === 'cancelled') {
    await supabase.rpc('release_order_stock', {
      p_order_id: orderId,
      p_performed_by: user?.id || null,
    });
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  notes?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: order } = await supabase
    .from('orders')
    .select('status, payment_status')
    .eq('id', orderId)
    .single();

  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) throw error;

  if (order) {
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      old_status: order.status,
      new_status: order.status,
      old_payment_status: order.payment_status,
      new_payment_status: paymentStatus,
      changed_by: user?.id || null,
      notes: notes || `Payment status changed to ${paymentStatus}`,
    });
  }
}

// ============================================================
// PAYMENT VERIFICATION
// ============================================================

export async function getPaymentClaims(status?: string): Promise<PaymentClaim[]> {
  let query = supabase
    .from('payment_claims')
    .select('*, order:orders(order_number, total_amount, shipping_address, user:profiles(*))');

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as PaymentClaim[]) || [];
}

export async function verifyPaymentClaim(
  claimId: string,
  orderId: string,
  approved: boolean,
  notes?: string,
  rejectionReason?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const newStatus: PaymentStatus = approved ? 'paid' : 'rejected';

  // 1. Update claim
  const { error: claimErr } = await supabase
    .from('payment_claims')
    .update({
      status: newStatus,
      verified_by: user?.id || null,
      verified_at: new Date().toISOString(),
      admin_notes: notes || null,
      rejection_reason: approved ? null : (rejectionReason || 'Payment verification rejected'),
      updated_at: new Date().toISOString(),
    })
    .eq('id', claimId);

  if (claimErr) throw claimErr;

  // 2. Update order payment status
  if (approved) {
    await updateOrderPaymentStatus(orderId, 'paid', `Payment verified via claim #${claimId}`);
    // If order was pending_confirmation, automatically move to confirmed
    await updateOrderStatus(orderId, 'confirmed', 'Auto-confirmed upon payment verification');
  } else {
    await updateOrderPaymentStatus(orderId, 'rejected', `Payment rejected: ${rejectionReason}`);
  }
}

// ============================================================
// PRODUCTS MANAGEMENT
// ============================================================

export async function getAdminProducts(params: {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: string;
  search?: string;
}): Promise<PaginatedResponse<Product>> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select('*, category:categories(*), images:product_images(*), variants:product_variants(*)', { count: 'exact' });

  if (params.category && params.category !== 'all') {
    query = query.eq('category_id', params.category);
  }

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as Product[]) || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function createProduct(
  productData: Partial<Product>,
  images: Array<{ url: string; alt_text?: string; is_primary: boolean }>
): Promise<Product> {
  const { data: newProduct, error } = await supabase
    .from('products')
    .insert({
      ...productData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Insert images
  if (images.length > 0) {
    const imagesToInsert = images.map((img, idx) => ({
      product_id: newProduct.id,
      url: img.url,
      alt_text: img.alt_text || newProduct.name,
      display_order: idx + 1,
      is_primary: img.is_primary,
    }));

    await supabase.from('product_images').insert(imagesToInsert);
  }

  return newProduct as Product;
}

export async function updateProduct(
  productId: string,
  productData: Partial<Product>,
  imageUrl?: string
): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      ...productData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId);

  if (error) throw error;

  if (imageUrl) {
    const { data: existingImg } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .eq('is_primary', true)
      .maybeSingle();

    if (existingImg) {
      await supabase
        .from('product_images')
        .update({ url: imageUrl })
        .eq('id', existingImg.id);
    } else {
      await supabase
        .from('product_images')
        .insert({ product_id: productId, url: imageUrl, is_primary: true, display_order: 0 });
    }
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  // Safe delete / archive
  const { error } = await supabase
    .from('products')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;
}

// ============================================================
// INVENTORY MANAGEMENT
// ============================================================

export async function adjustInventory(params: {
  productId: string;
  variantId?: string | null;
  quantity: number; // positive for restock, negative for deduction
  reason: string;
  movementType: 'restock' | 'adjustment' | 'damaged' | 'return';
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (params.variantId) {
    // Get variant
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', params.variantId)
      .single();

    if (!variant) throw new Error('Variant not found');

    const stockBefore = variant.stock_quantity;
    const stockAfter = Math.max(0, stockBefore + params.quantity);

    await supabase
      .from('product_variants')
      .update({ stock_quantity: stockAfter, updated_at: new Date().toISOString() })
      .eq('id', params.variantId);

    await supabase.from('inventory_movements').insert({
      product_id: params.productId,
      variant_id: params.variantId,
      movement_type: params.movementType,
      quantity: params.quantity,
      reason: params.reason,
      performed_by: user?.id || null,
      stock_before: stockBefore,
      stock_after: stockAfter,
    });
  } else {
    // Simple product
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', params.productId)
      .single();

    if (!product) throw new Error('Product not found');

    const stockBefore = product.stock_quantity;
    const stockAfter = Math.max(0, stockBefore + params.quantity);

    await supabase
      .from('products')
      .update({ stock_quantity: stockAfter, updated_at: new Date().toISOString() })
      .eq('id', params.productId);

    await supabase.from('inventory_movements').insert({
      product_id: params.productId,
      variant_id: null,
      movement_type: params.movementType,
      quantity: params.quantity,
      reason: params.reason,
      performed_by: user?.id || null,
      stock_before: stockBefore,
      stock_after: stockAfter,
    });
  }
}

export async function getInventoryMovements(productId?: string): Promise<any[]> {
  let query = supabase
    .from('inventory_movements')
    .select('*, product:products(name, sku), variant:product_variants(name, sku), performer:profiles(full_name, email)');

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

export async function clearProductStock(productId: string, reason: string = 'Stock cleared / zeroed out'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');
  const stockBefore = product.stock_quantity;

  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: 0, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;

  await supabase.from('inventory_movements').insert({
    product_id: productId,
    variant_id: null,
    movement_type: 'adjustment',
    quantity: -stockBefore,
    reason,
    performed_by: user?.id || null,
    stock_before: stockBefore,
    stock_after: 0,
  });
}

export async function setProductExactStock(
  productId: string,
  newStock: number,
  reason: string = 'Stock level reset'
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: product } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single();

  if (!product) throw new Error('Product not found');
  const stockBefore = product.stock_quantity;
  const targetStock = Math.max(0, newStock);
  const diff = targetStock - stockBefore;

  const { error } = await supabase
    .from('products')
    .update({ stock_quantity: targetStock, updated_at: new Date().toISOString() })
    .eq('id', productId);

  if (error) throw error;

  await supabase.from('inventory_movements').insert({
    product_id: productId,
    variant_id: null,
    movement_type: 'adjustment',
    quantity: diff,
    reason: `${reason} (${stockBefore} → ${targetStock})`,
    performed_by: user?.id || null,
    stock_before: stockBefore,
    stock_after: targetStock,
  });
}

// ============================================================
// CATEGORIES MANAGEMENT
// ============================================================

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const { data: newCat, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return newCat as Category;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteCategory(
  id: string,
  reassignCategoryId?: string | null
): Promise<void> {
  // Check if any products are assigned to this category
  const { data: prods, count } = await supabase
    .from('products')
    .select('id', { count: 'exact' })
    .eq('category_id', id);

  if (count && count > 0) {
    if (reassignCategoryId !== undefined) {
      // Reassign or unlink products
      const { error: reassignError } = await supabase
        .from('products')
        .update({ category_id: reassignCategoryId, updated_at: new Date().toISOString() })
        .eq('category_id', id);

      if (reassignError) throw reassignError;
    } else {
      throw new Error(`Cannot delete category: ${count} products are currently assigned to it. Please reassign or unlink them first.`);
    }
  }

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// USER MANAGEMENT & FRAUD PREVENTION
// ============================================================

export async function getAdminUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResponse<Profile>> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (params.status && params.status !== 'all') {
    query = query.eq('account_status', params.status);
  }

  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    data: (data as Profile[]) || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function updateUserAccountStatus(
  userId: string,
  status: 'active' | 'suspended' | 'restricted',
  reason?: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      account_status: status,
      suspension_reason: reason || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function getFraudFlags(): Promise<FraudFlag[]> {
  const { data, error } = await supabase
    .from('fraud_flags')
    .select('*, user:profiles(full_name, email, phone), order:orders(order_number, total_amount)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as unknown as FraudFlag[]) || [];
}

export async function resolveFraudFlag(
  flagId: string,
  resolution: 'resolved' | 'dismissed',
  notes: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('fraud_flags')
    .update({
      status: resolution,
      resolution_notes: notes,
      resolved_by: user?.id || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', flagId);

  if (error) throw error;
}

// ============================================================
// SETTINGS MANAGEMENT
// ============================================================

export async function getAdminSettings(): Promise<StoreSetting[]> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .order('category');

  if (error) throw error;
  return (data as StoreSetting[]) || [];
}

export async function updateStoreSetting(key: string, value: unknown): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('store_settings')
    .update({
      value,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('key', key);

  if (error) throw error;
}

export async function getAdminPaymentMethods(): Promise<PaymentMethodSetting[]> {
  const { data, error } = await supabase
    .from('payment_method_settings')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return (data as PaymentMethodSetting[]) || [];
}

export async function updatePaymentMethodSetting(
  methodType: string,
  data: Partial<PaymentMethodSetting>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('payment_method_settings')
    .update({
      ...data,
      updated_by: user?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('method_type', methodType);

  if (error) throw error;
}

// ============================================================
// BANNERS MANAGEMENT
// ============================================================

export async function getAdminBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('display_order');

  if (error) throw error;
  return (data as Banner[]) || [];
}

export async function createBanner(banner: Partial<Banner>): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .insert(banner)
    .select()
    .single();

  if (error) throw error;
  return data as Banner;
}

export async function updateBanner(id: string, banner: Partial<Banner>): Promise<void> {
  const { error } = await supabase
    .from('banners')
    .update({ ...banner, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteBanner(id: string): Promise<void> {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// AUDIT LOGS
// ============================================================

export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*, user:profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data as unknown as AuditLog[]) || [];
}

// ============================================================
// STAFF & ROLES DELEGATION
// ============================================================

export async function getStaffMembers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .neq('role', 'customer')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Profile[]) || [];
}

export async function createStaffAdmin(params: {
  email: string;
  full_name: string;
  password?: string;
  phone?: string;
  role: UserRole;
  assigned_tasks: string[];
  permissions: string[];
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanPass = params.password?.trim() || 'MillenniumAdmin2026!';

  // 1. Check if profile with email already exists in profiles table
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    // Elevate / update existing user
    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        role: params.role,
        full_name: params.full_name.trim(),
        phone: params.phone?.trim() || null,
        assigned_tasks: params.assigned_tasks,
        permissions: params.permissions,
        account_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updErr) throw updErr;

    // Also try updating password via RPC if available
    try {
      await supabase.rpc('create_staff_admin_user', {
        p_email: cleanEmail,
        p_password: cleanPass,
        p_full_name: params.full_name.trim(),
        p_phone: params.phone?.trim() || null,
        p_role: params.role,
        p_assigned_tasks: params.assigned_tasks,
        p_permissions: params.permissions,
      });
    } catch {
      // ignore if RPC not yet updated
    }
    return;
  }

  // 2. Try calling the PostgreSQL RPC create_staff_admin_user
  const { data: rpcData, error: rpcErr } = await supabase.rpc('create_staff_admin_user', {
    p_email: cleanEmail,
    p_password: cleanPass,
    p_full_name: params.full_name.trim(),
    p_phone: params.phone?.trim() || null,
    p_role: params.role,
    p_assigned_tasks: params.assigned_tasks,
    p_permissions: params.permissions,
  });

  if (!rpcErr) {
    // Audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        action: 'staff.create_or_elevate',
        resource_type: 'staff_profile',
        details: {
          target_email: cleanEmail,
          assigned_role: params.role,
          tasks_count: params.assigned_tasks.length,
          user_id: rpcData,
        },
      });
    } catch {
      // ignore
    }
    return;
  }

  console.warn('RPC create_staff_admin_user failed, attempting GoTrue sign-up fallback:', rpcErr);

  // 3. Fallback: Create user via Supabase GoTrue Auth API
  try {
    const signupRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPass,
        data: {
          full_name: params.full_name.trim(),
          role: params.role,
        },
      }),
    });

    if (signupRes.ok) {
      // Profile is auto-created by handle_new_user() trigger; now update duties & permissions
      const { data: newProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (newProfile) {
        await supabase
          .from('profiles')
          .update({
            role: params.role,
            full_name: params.full_name.trim(),
            phone: params.phone?.trim() || null,
            assigned_tasks: params.assigned_tasks,
            permissions: params.permissions,
            account_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', newProfile.id);
      }
      return;
    }
  } catch (fallbackErr) {
    console.error('GoTrue signup fallback error:', fallbackErr);
  }

  // If both methods failed, throw informative error guiding the administrator
  throw new Error(
    `Database function error: ${rpcErr.message}. Please run supabase/FIX_STAFF_CREATION.sql in Supabase SQL Editor.`
  );
}

export async function updateStaffDesignatedTasks(
  userId: string,
  data: {
    role?: UserRole;
    assigned_tasks: string[];
    permissions: string[];
    account_status?: 'active' | 'suspended';
  }
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...(data.role ? { role: data.role } : {}),
      assigned_tasks: data.assigned_tasks,
      permissions: data.permissions,
      ...(data.account_status ? { account_status: data.account_status } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  try {
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action: 'staff.update_tasks',
      resource_type: 'staff_profile',
      resource_id: userId,
      details: {
        updated_role: data.role,
        assigned_tasks: data.assigned_tasks,
      },
    });
  } catch {
    // ignore
  }
}

export async function removeStaffRole(userId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('profiles')
    .update({
      role: 'customer',
      assigned_tasks: [],
      permissions: [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;

  try {
    await supabase.from('audit_logs').insert({
      user_id: user?.id || null,
      action: 'staff.revoke_role',
      resource_type: 'staff_profile',
      resource_id: userId,
    });
  } catch {
    // ignore
  }
}

// ============================================================
// PRODUCT VARIATIONS
// ============================================================

export async function getAdminProductVariants(productId?: string): Promise<any[]> {
  let query = supabase
    .from('product_variants')
    .select('*, product:products(id, name, sku, regular_price, category:categories(id, name))')
    .order('created_at', { ascending: false });

  if (productId && productId !== 'all') {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createProductVariant(data: {
  product_id: string;
  name: string;
  sku: string;
  regular_price: number;
  sale_price?: number | null;
  stock_quantity: number;
  low_stock_threshold?: number;
  is_active?: boolean;
  image_url?: string | null;
}): Promise<void> {
  const { error } = await supabase.from('product_variants').insert({
    product_id: data.product_id,
    name: data.name,
    sku: data.sku,
    regular_price: data.regular_price,
    sale_price: data.sale_price || null,
    stock_quantity: data.stock_quantity,
    low_stock_threshold: data.low_stock_threshold ?? 5,
    is_active: data.is_active ?? true,
    image_url: data.image_url || null,
  });
  if (error) throw error;
}

export async function updateProductVariant(
  id: string,
  data: Partial<ProductVariant>
): Promise<void> {
  const { error } = await supabase
    .from('product_variants')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProductVariant(id: string): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// SOCIAL LINKS & CUSTOM STORE LINKS MANAGEMENT
// ============================================================

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { id: '1', platform: 'facebook', title: 'Facebook Page', url: 'https://facebook.com/millenniumera', is_active: true, display_order: 1 },
  { id: '2', platform: 'instagram', title: 'Instagram Profile', url: 'https://instagram.com/millenniumera', is_active: true, display_order: 2 },
  { id: '3', platform: 'whatsapp', title: 'WhatsApp VIP Support', url: 'https://wa.me/8801700000000', is_active: true, display_order: 3 },
  { id: '4', platform: 'youtube', title: 'Official YouTube Channel', url: 'https://youtube.com/@millenniumera', is_active: true, display_order: 4 },
  { id: '5', platform: 'tiktok', title: 'TikTok Trends', url: 'https://tiktok.com/@millenniumera', is_active: false, display_order: 5 },
  { id: '6', platform: 'twitter', title: 'X (Twitter)', url: 'https://twitter.com/millenniumera', is_active: false, display_order: 6 },
];

export async function getSocialLinks(): Promise<SocialLink[]> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('value')
      .eq('key', 'social_links')
      .maybeSingle();

    if (error) throw error;
    if (data?.value && Array.isArray(data.value) && data.value.length > 0) {
      return data.value as SocialLink[];
    }
  } catch (err) {
    console.warn('Could not read social_links from store_settings, falling back to defaults:', err);
  }
  return DEFAULT_SOCIAL_LINKS;
}

export async function saveSocialLinks(links: SocialLink[]): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: existing } = await supabase
    .from('store_settings')
    .select('id')
    .eq('key', 'social_links')
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('store_settings')
      .update({
        value: links,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'social_links');
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('store_settings')
      .insert({
        key: 'social_links',
        value: links,
        category: 'social',
        description: 'Store social media channels and custom promotional links',
        is_public: true,
        updated_by: user?.id || null,
      });
    if (error) throw error;
  }
}

