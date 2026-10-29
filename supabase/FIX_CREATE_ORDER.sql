-- ============================================================
-- MILLENNIUM ERA — FIX CHECKOUT & ORDER CREATION FUNCTION
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_order(
  p_items JSONB,
  p_shipping_address JSONB,
  p_user_id UUID DEFAULT NULL,
  p_billing_address JSONB DEFAULT NULL,
  p_payment_method payment_method_type DEFAULT 'cod',
  p_coupon_code TEXT DEFAULT NULL,
  p_customer_notes TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_shipping_zone_id UUID DEFAULT NULL,
  p_guest_email TEXT DEFAULT NULL,
  p_guest_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth, extensions
AS $$
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
  v_has_coupon BOOLEAN := FALSE;
  v_coupon_id UUID := NULL;
  v_coupon_type coupon_type := NULL;
  v_payment_setting RECORD;
  v_shipping_zone RECORD;
  v_image_url TEXT;
  v_variant_name TEXT;
  v_variant_sku TEXT;
  v_variation_details JSONB;
  v_stock_before INTEGER;
  v_effective_user_id UUID;
BEGIN
  -- Determine user ID (caller auth.uid() or supplied)
  v_effective_user_id := COALESCE(auth.uid(), p_user_id);

  -- 1. Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, order_number, total_amount INTO v_order_id, v_order_number, v_total_amount 
    FROM orders WHERE idempotency_key = p_idempotency_key;
    IF v_order_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true, 
        'order_id', v_order_id, 
        'order_number', v_order_number,
        'total_amount', v_total_amount,
        'duplicate', true
      );
    END IF;
  END IF;

  -- 2. Validate payment method
  SELECT * INTO v_payment_setting FROM payment_method_settings
    WHERE method_type = p_payment_method AND is_enabled = TRUE;

  -- 3. Pre-calculate subtotal by scanning items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products
      WHERE id = (v_item->>'product_id')::UUID AND status = 'active';
    IF FOUND THEN
      IF v_product.has_variants AND v_item->>'variant_id' IS NOT NULL THEN
        SELECT * INTO v_variant FROM product_variants
          WHERE id = (v_item->>'variant_id')::UUID AND is_active = TRUE;
        IF FOUND THEN
          v_unit_price := COALESCE(v_variant.sale_price, v_variant.regular_price);
        ELSE
          v_unit_price := COALESCE(v_product.sale_price, v_product.regular_price);
        END IF;
      ELSE
        v_unit_price := COALESCE(v_product.sale_price, v_product.regular_price);
      END IF;
      v_subtotal := v_subtotal + (v_unit_price * (v_item->>'quantity')::INTEGER);
    END IF;
  END LOOP;

  -- 4. Apply coupon safely without unassigned RECORD errors
  IF p_coupon_code IS NOT NULL AND length(trim(p_coupon_code)) > 0 THEN
    SELECT * INTO v_coupon FROM coupons
      WHERE code = UPPER(TRIM(p_coupon_code))
      AND is_active = TRUE
      AND (starts_at IS NULL OR starts_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (usage_limit IS NULL OR usage_count < usage_limit);

    IF FOUND THEN
      v_has_coupon := TRUE;
      v_coupon_id := v_coupon.id;
      v_coupon_type := v_coupon.coupon_type;

      IF v_coupon.minimum_order_amount IS NULL OR v_subtotal >= v_coupon.minimum_order_amount THEN
        IF v_coupon_type = 'percentage' THEN
          v_discount_amount := (v_subtotal * v_coupon.value) / 10000;
          IF v_coupon.maximum_discount_amount IS NOT NULL AND v_discount_amount > v_coupon.maximum_discount_amount THEN
            v_discount_amount := v_coupon.maximum_discount_amount;
          END IF;
        ELSIF v_coupon_type = 'fixed_amount' THEN
          v_discount_amount := LEAST(v_coupon.value, v_subtotal);
        END IF;
      END IF;
    END IF;
  END IF;

  -- 5. Calculate shipping fee
  IF p_shipping_zone_id IS NOT NULL THEN
    SELECT * INTO v_shipping_zone FROM shipping_zones
      WHERE id = p_shipping_zone_id AND is_active = TRUE;
    IF FOUND THEN
      v_shipping_amount := v_shipping_zone.shipping_fee;
      IF v_shipping_zone.free_shipping_threshold IS NOT NULL
         AND (v_subtotal - v_discount_amount) >= v_shipping_zone.free_shipping_threshold THEN
        v_shipping_amount := 0;
      END IF;
      IF v_has_coupon AND v_coupon_type = 'free_shipping' THEN
        v_shipping_amount := 0;
      END IF;
    END IF;
  END IF;

  -- 6. Calculate total amount
  v_total_amount := GREATEST(0, v_subtotal - v_discount_amount + v_shipping_amount);

  -- 7. Generate order ID and unique order number
  v_order_id := gen_random_uuid();
  v_order_number := 'ME-' || to_char(NOW(), 'YYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

  -- 8. INSERT PARENT ORDER RECORD FIRST (Satisfying foreign key order_items_order_id_fkey)
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
    v_order_id, v_order_number, v_effective_user_id,
    p_guest_email, p_guest_phone,
    'pending_confirmation',
    CASE WHEN p_payment_method = 'cod' THEN 'cod_pending'::payment_status ELSE 'unpaid'::payment_status END,
    p_payment_method,
    v_subtotal, v_discount_amount, v_shipping_amount, v_total_amount,
    v_coupon_id, p_coupon_code,
    p_shipping_zone_id, COALESCE(v_shipping_zone.name, 'Standard Delivery'),
    COALESCE(v_shipping_zone.estimated_delivery, '3-7 business days'),
    p_shipping_address, p_billing_address,
    p_customer_notes, p_idempotency_key
  );

  -- 9. INSERT CHILD ORDER ITEMS NOW THAT ORDERS ROW EXISTS
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_product FROM products
      WHERE id = (v_item->>'product_id')::UUID AND status = 'active';

    IF FOUND THEN
      v_variant_name := NULL;
      v_variant_sku := NULL;
      v_variation_details := '{}'::JSONB;
      v_image_url := NULL;

      IF v_product.has_variants AND v_item->>'variant_id' IS NOT NULL THEN
        SELECT * INTO v_variant FROM product_variants
          WHERE id = (v_item->>'variant_id')::UUID AND product_id = v_product.id AND is_active = TRUE;
        IF FOUND THEN
          v_unit_price := COALESCE(v_variant.sale_price, v_variant.regular_price);
          v_regular_price := v_variant.regular_price;
          v_stock_qty := v_variant.stock_quantity;
          v_image_url := v_variant.image_url;
          v_variant_name := v_variant.name;
          v_variant_sku := v_variant.sku;
        ELSE
          v_unit_price := COALESCE(v_product.sale_price, v_product.regular_price);
          v_regular_price := v_product.regular_price;
          v_stock_qty := v_product.stock_quantity;
        END IF;
      ELSE
        v_unit_price := COALESCE(v_product.sale_price, v_product.regular_price);
        v_regular_price := v_product.regular_price;
        v_stock_qty := v_product.stock_quantity;
      END IF;

      IF v_image_url IS NULL THEN
        SELECT url INTO v_image_url FROM product_images
          WHERE product_id = v_product.id AND is_primary = TRUE LIMIT 1;
      END IF;

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
        v_variation_details
      );

      -- Deduct stock
      IF v_product.track_inventory THEN
        IF v_product.has_variants AND v_item->>'variant_id' IS NOT NULL THEN
          UPDATE product_variants
          SET stock_quantity = GREATEST(0, stock_quantity - (v_item->>'quantity')::INTEGER)
          WHERE id = (v_item->>'variant_id')::UUID;
        ELSE
          UPDATE products
          SET stock_quantity = GREATEST(0, stock_quantity - (v_item->>'quantity')::INTEGER)
          WHERE id = v_product.id;
        END IF;
      END IF;

      UPDATE products SET total_sold = total_sold + (v_item->>'quantity')::INTEGER
      WHERE id = v_product.id;
    END IF;
  END LOOP;

  -- 10. Record status history
  INSERT INTO order_status_history (
    order_id, new_status, new_payment_status, changed_by, notes
  ) VALUES (
    v_order_id, 'pending_confirmation',
    CASE WHEN p_payment_method = 'cod' THEN 'cod_pending'::payment_status ELSE 'unpaid'::payment_status END,
    v_effective_user_id, 'Order created'
  );

  -- 11. Clear cart
  IF v_effective_user_id IS NOT NULL THEN
    DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = v_effective_user_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount,
    'duplicate', false
  );
END;
$$;

-- Grant permissions for both logged-in customers and guest checkouts
GRANT EXECUTE ON FUNCTION public.create_order(JSONB, JSONB, UUID, JSONB, payment_method_type, TEXT, TEXT, TEXT, UUID, TEXT, TEXT) TO anon, authenticated;
