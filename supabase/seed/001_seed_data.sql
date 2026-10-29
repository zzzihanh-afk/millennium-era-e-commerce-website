-- ============================================================
-- MILLENNIUM ERA — SEED DATA
-- ============================================================
-- This is TEST data only. Replace with real data before going live.
-- All prices are in paisa (integer minor units). 1 BDT = 100 paisa.
-- ============================================================

-- Store Settings
INSERT INTO store_settings (key, value, category, description, is_public) VALUES
  ('store_name', '"Millennium Era"', 'general', 'Store name', TRUE),
  ('store_tagline', '"Shop Beyond Time"', 'general', 'Store tagline', TRUE),
  ('store_email', '"info@millenniumera.com"', 'general', 'Store contact email', TRUE),
  ('store_phone', '"+880 1XXX-XXXXXX"', 'general', 'Store phone number', TRUE),
  ('store_address', '{"line1": "Your Address Here", "city": "Dhaka", "country": "Bangladesh"}'::JSONB, 'general', 'Store address', TRUE),
  ('store_currency', '"BDT"', 'general', 'Store currency code', TRUE),
  ('store_currency_symbol', '"৳"', 'general', 'Currency symbol', TRUE),
  ('store_logo', '"/assets/logo.png"', 'general', 'Store logo URL', TRUE),
  ('guest_checkout_enabled', 'true', 'checkout', 'Allow guest checkout', FALSE),
  ('min_order_amount', '10000', 'checkout', 'Minimum order amount in paisa (৳100)', FALSE),
  ('max_order_amount', '50000000', 'checkout', 'Maximum order amount in paisa (৳500,000)', FALSE),
  ('free_shipping_threshold', '500000', 'shipping', 'Free shipping for orders above this (৳5,000)', TRUE),
  ('return_policy', '"We accept returns within 7 days of delivery. Items must be unused and in original packaging."', 'policies', 'Return policy text', TRUE),
  ('shipping_policy', '"We ship across Bangladesh. Standard delivery takes 3-7 business days."', 'policies', 'Shipping policy text', TRUE),
  ('maintenance_mode', 'false', 'system', 'Enable maintenance mode', FALSE),
  ('whatsapp_number', '"+880 1XXX-XXXXXX"', 'contact', 'WhatsApp contact number', TRUE)
ON CONFLICT (key) DO NOTHING;

-- Payment Method Settings
INSERT INTO payment_method_settings (method_type, display_name, is_enabled, instructions, account_type, account_label, account_number, display_order, additional_config) VALUES
  ('cod', 'Cash on Delivery', TRUE, 'Pay when you receive your order. Our delivery agent will collect the payment.', NULL, NULL, NULL, 1, '{"verification_required": false}'::JSONB),
  ('bkash', 'bKash', TRUE, 'Send money to the number below and enter your transaction ID.', 'Merchant', 'bKash Merchant', '01XXX-XXXXXX', 2, '{"send_money_type": "Send Money"}'::JSONB),
  ('nagad', 'Nagad', TRUE, 'Send money to the number below and enter your transaction ID.', 'Personal', 'Nagad Personal', '01XXX-XXXXXX', 3, '{"send_money_type": "Send Money"}'::JSONB),
  ('rocket', 'Rocket', TRUE, 'Send money to the number below and enter your transaction ID.', 'Personal', 'Rocket Personal', '01XXX-XXXXXX', 4, '{"send_money_type": "Send Money"}'::JSONB)
ON CONFLICT (method_type) DO NOTHING;

-- Shipping Zones
INSERT INTO shipping_zones (name, slug, description, shipping_fee, free_shipping_threshold, estimated_delivery, is_active, display_order) VALUES
  ('Inside Dhaka', 'inside-dhaka', 'Delivery within Dhaka city', 8000, 500000, '1-3 business days', TRUE, 1),
  ('Outside Dhaka', 'outside-dhaka', 'Delivery outside Dhaka city', 15000, 500000, '3-7 business days', TRUE, 2)
ON CONFLICT (slug) DO NOTHING;

-- Social Links
INSERT INTO social_links (platform, url, icon, display_order, is_active) VALUES
  ('facebook', 'https://facebook.com/millenniumera', 'facebook', 1, TRUE),
  ('instagram', 'https://instagram.com/millenniumera', 'instagram', 2, TRUE),
  ('youtube', 'https://youtube.com/@millenniumera', 'youtube', 3, TRUE),
  ('tiktok', 'https://tiktok.com/@millenniumera', 'music', 4, TRUE)
ON CONFLICT (platform) DO NOTHING;

-- Product Attributes
INSERT INTO product_attributes (name, slug, display_name, display_order) VALUES
  ('size', 'size', 'Size', 1),
  ('color', 'color', 'Color', 2),
  ('material', 'material', 'Material', 3),
  ('storage', 'storage', 'Storage', 4),
  ('style', 'style', 'Style', 5)
ON CONFLICT (slug) DO NOTHING;

-- Attribute Values — Sizes
INSERT INTO product_attribute_values (attribute_id, value, slug, display_order) VALUES
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'XS', 'xs', 1),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'S', 's', 2),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'M', 'm', 3),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'L', 'l', 4),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'XL', 'xl', 5),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'XXL', 'xxl', 6),
  ((SELECT id FROM product_attributes WHERE slug = 'size'), 'Free Size', 'free-size', 7)
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- Attribute Values — Colors
INSERT INTO product_attribute_values (attribute_id, value, slug, display_order, color_hex) VALUES
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Red', 'red', 1, '#EF4444'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Blue', 'blue', 2, '#3B82F6'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Black', 'black', 3, '#000000'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'White', 'white', 4, '#FFFFFF'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Green', 'green', 5, '#22C55E'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Navy', 'navy', 6, '#1E3A5F'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Gray', 'gray', 7, '#6B7280'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Pink', 'pink', 8, '#EC4899'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Brown', 'brown', 9, '#92400E'),
  ((SELECT id FROM product_attributes WHERE slug = 'color'), 'Beige', 'beige', 10, '#D4A574')
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- Categories
INSERT INTO categories (name, slug, description, image_url, icon, display_order, is_active) VALUES
  ('Fashion', 'fashion', 'Designer apparel, outerwear, and footwear', 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300&auto=format&fit=crop&q=80', 'shirt', 1, TRUE),
  ('Electronics', 'electronics', 'Smart devices, audio, and personal gadgets', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80', 'smartphone', 2, TRUE),
  ('Home & Living', 'home-living', 'Kitchen appliances, furniture, and decor', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&auto=format&fit=crop&q=80', 'home', 3, TRUE),
  ('Beauty & Health', 'beauty-health', 'Cosmetics, skincare, and wellness sets', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80', 'heart', 4, TRUE),
  ('Sports & Fitness', 'sports-fitness', 'Performance footwear, equipment, and sportswear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80', 'dumbbell', 5, TRUE),
  ('Toys & Games', 'toys-games', 'High-speed RC cars, collectibles, and games', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=300&auto=format&fit=crop&q=80', 'gamepad-2', 6, TRUE),
  ('Accessories', 'accessories', 'Designer bags, backpacks, and timepieces', 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&auto=format&fit=crop&q=80', 'watch', 7, TRUE),
  ('Books & Stationery', 'books-stationery', 'Premium journals, fountain pens, and desk sets', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&auto=format&fit=crop&q=80', 'book-open', 8, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description;

-- Sample Products (matching reference mockup, prices in paisa)
INSERT INTO products (name, slug, sku, category_id, short_description, description, regular_price, sale_price, status, is_featured, has_variants, stock_quantity, low_stock_threshold) VALUES
  (
    'Running Shoes',
    'running-shoes',
    'ME-RS-001',
    (SELECT id FROM categories WHERE slug = 'sports-fitness'),
    'Ultra-lightweight sports running shoes with responsive air cushioning and breathable mesh.',
    'Engineered for high performance and daily luxury comfort. Crafted with breathable knit mesh, durable aerodynamic outsoles, and ergonomic arch support. Perfect for running, training, and athletic streetwear in Bangladesh.',
    499900, 399900, 'active', TRUE, TRUE, 45, 5
  ),
  (
    'Smart Watch',
    'smart-watch',
    'ME-SW-002',
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'Luxury AMOLED smartwatch with heart rate tracking, sleep monitoring, and calling features.',
    'Stay ahead of time with the Millennium Era Smart Watch. Features an ultra-bright AMOLED display encased in premium metallic gold trim, real-time SpO2 and pulse sensors, 100+ fitness tracking modes, and up to 10 days of battery life.',
    599900, NULL, 'active', TRUE, FALSE, 28, 5
  ),
  (
    'Ladies Handbag',
    'ladies-handbag',
    'ME-HB-003',
    (SELECT id FROM categories WHERE slug = 'fashion'),
    'Premium genuine calfskin leather handbag with 24k electroplated gold accents.',
    'Handcrafted from supple full-grain leather, this statement handbag exudes timeless sophistication. Structured silhouette, secure magnetic clasp, satin-lined interior with zip pockets, and an adjustable strap.',
    499900, 424900, 'active', TRUE, TRUE, 32, 4
  ),
  (
    'Wireless Earbuds',
    'wireless-earbuds',
    'ME-WE-004',
    (SELECT id FROM categories WHERE slug = 'electronics'),
    'Active noise-cancelling earbuds with 36-hour total battery life and spatial audio.',
    'Pure acoustics redefined. Enjoy hybrid active noise cancellation (ANC), ultra-low latency game mode, dual MEMS beamforming mics, and wireless Qi quick-charging.',
    299900, NULL, 'active', TRUE, FALSE, 60, 8
  ),
  (
    'Winter Jacket',
    'winter-jacket',
    'ME-WJ-005',
    (SELECT id FROM categories WHERE slug = 'fashion'),
    'Thermal insulated windproof & waterproof puffer winter jacket with detachable hood.',
    'Engineered for sub-zero protection and city fashion. Packed with high-loft thermal insulation, matte finish waterproof outer shell, fleece-lined handwarmer pockets, and heavy-duty YKK zippers.',
    799900, 599900, 'active', TRUE, TRUE, 22, 5
  ),
  (
    'Remote Control Car',
    'remote-control-car',
    'ME-RC-006',
    (SELECT id FROM categories WHERE slug = 'toys-games'),
    '1:14 scale 4WD high-speed drift RC racing vehicle with 2.4GHz proportional control.',
    'Built for pure adrenaline and off-road capability. Features 4-wheel independent oil-filled suspension, dual high-torque motors reaching 45 km/h, and 2x rechargeable lithium battery packs.',
    299900, 269900, 'active', FALSE, FALSE, 18, 5
  ),
  (
    'Makeup Kit',
    'makeup-kit',
    'ME-MK-007',
    (SELECT id FROM categories WHERE slug = 'beauty-health'),
    'Complete 36-shade luxury cosmetic makeup palette set with cruelty-free professional brushes.',
    'Everything you need to craft subtle daytime glow or dramatic evening glamour. Formulated with ultra-fine pigments for smooth blendability and 16-hour long-wear performance.',
    349900, NULL, 'active', FALSE, FALSE, 40, 6
  ),
  (
    'Air Fryer',
    'air-fryer',
    'ME-AF-008',
    (SELECT id FROM categories WHERE slug = 'home-living'),
    '5.5L digital touch-screen air fryer with 360° rapid heat air circulation and 8 presets.',
    'Cook deliciously crispy, guilt-free meals with up to 85% less oil. Featuring an intuitive LED one-touch display, dishwasher-safe non-stick basket, auto-pause safety, and rapid 1700W heating element.',
    799900, 649900, 'active', TRUE, FALSE, 16, 4
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  regular_price = EXCLUDED.regular_price,
  sale_price = EXCLUDED.sale_price,
  short_description = EXCLUDED.short_description;

-- Product Images
INSERT INTO product_images (product_id, url, alt_text, display_order, is_primary) VALUES
  ((SELECT id FROM products WHERE slug = 'running-shoes'), 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', 'Running Shoes in Red and White', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'running-shoes'), 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=700&auto=format&fit=crop&q=80', 'Running Shoes Profile Angle', 2, FALSE),
  ((SELECT id FROM products WHERE slug = 'smart-watch'), 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=700&auto=format&fit=crop&q=80', 'Smart Watch with AMOLED Screen and Gold Bezel', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'ladies-handbag'), 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80', 'Luxury Red Calfskin Handbag', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'wireless-earbuds'), 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=700&auto=format&fit=crop&q=80', 'Black Wireless Noise Cancelling Earbuds', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'winter-jacket'), 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80', 'Red Waterproof Winter Puffer Jacket', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'remote-control-car'), 'https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=700&auto=format&fit=crop&q=80', 'High Speed Red Racing Buggy RC Car', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'makeup-kit'), 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=700&auto=format&fit=crop&q=80', 'Luxury Cosmetic Makeup Kit and Brushes', 1, TRUE),
  ((SELECT id FROM products WHERE slug = 'air-fryer'), 'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=700&auto=format&fit=crop&q=80', 'Modern Digital Black Air Fryer', 1, TRUE)
ON CONFLICT DO NOTHING;

-- Product Variants (for configurable items)
INSERT INTO product_variants (product_id, sku, name, regular_price, sale_price, stock_quantity, low_stock_threshold, is_active, image_url, display_order) VALUES
  ((SELECT id FROM products WHERE slug = 'running-shoes'), 'ME-RS-001-RED-40', 'Red / Size 40', 499900, 399900, 15, 3, TRUE, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', 1),
  ((SELECT id FROM products WHERE slug = 'running-shoes'), 'ME-RS-001-RED-41', 'Red / Size 41', 499900, 399900, 12, 3, TRUE, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', 2),
  ((SELECT id FROM products WHERE slug = 'running-shoes'), 'ME-RS-001-BLK-42', 'Black / Size 42', 520000, 419900, 8, 3, TRUE, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=700&auto=format&fit=crop&q=80', 3),
  ((SELECT id FROM products WHERE slug = 'ladies-handbag'), 'ME-HB-003-RED-GLD', 'Vibrant Red / Gold Trim', 499900, 424900, 18, 3, TRUE, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80', 1),
  ((SELECT id FROM products WHERE slug = 'ladies-handbag'), 'ME-HB-003-BLK-GLD', 'Classic Black / Gold Trim', 499900, 424900, 14, 3, TRUE, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=700&auto=format&fit=crop&q=80', 2),
  ((SELECT id FROM products WHERE slug = 'winter-jacket'), 'ME-WJ-005-RED-M', 'Red / Medium', 799900, 599900, 8, 2, TRUE, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80', 1),
  ((SELECT id FROM products WHERE slug = 'winter-jacket'), 'ME-WJ-005-RED-L', 'Red / Large', 799900, 599900, 10, 2, TRUE, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=700&auto=format&fit=crop&q=80', 2)
ON CONFLICT (sku) DO NOTHING;

-- Banners
INSERT INTO banners (title, subtitle, description, image_url, cta_text, cta_url, status, display_order) VALUES
  ('Millennium Era', 'Premium Products | Best Prices | Trusted Shopping', 'Elevate your everyday lifestyle with our hand-picked luxury collection crafted for perfection in Bangladesh.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', 'Shop Now', '/shop', 'active', 1),
  ('New Season Arrival', 'Trending Fashion & Elite Electronics', 'Discover the latest releases with nationwide express delivery across Dhaka and all 64 districts.', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', 'Explore Collection', '/shop?sort=newest', 'active', 2),
  ('Special Promotions', 'Up to 25% Off Luxury Footwear & Timepieces', 'Limited-time discounts on curated best sellers. Secure Cash on Delivery and verified mobile payments.', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&auto=format&fit=crop&q=80', 'View Offers', '/offers', 'active', 3)
ON CONFLICT DO NOTHING;
