// ============================================================
// Millennium Era — Product Service
// ============================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Product,
  PaginatedResponse,
} from '@/types';
import { DEMO_PRODUCTS } from '@/lib/demoData';

// ---- Query Options ----

export interface GetProductsOptions {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  search?: string;
  minPrice?: number; // paisa
  maxPrice?: number; // paisa
  sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
  inStock?: boolean;
  featured?: boolean;
}

// ---- Helpers ----

const PRODUCT_LIST_SELECT = `
  *,
  category:categories!category_id(id, name, slug),
  images:product_images(id, url, alt_text, display_order, is_primary)
`;

const PRODUCT_DETAIL_SELECT = `
  *,
  category:categories!category_id(id, name, slug),
  images:product_images(id, url, alt_text, display_order, is_primary),
  variants:product_variants(
    *,
    attribute_values:variant_attribute_values(
      *,
      attribute:product_attributes(*),
      attribute_value:product_attribute_values(*)
    )
  ),
  attribute_configs:product_attribute_configs(
    *,
    attribute:product_attributes(
      *,
      values:product_attribute_values(*)
    )
  )
`;

function applySorting(query: any, sortBy: string) {
  switch (sortBy) {
    case 'newest':
      return query.order('created_at', { ascending: false });
    case 'oldest':
      return query.order('created_at', { ascending: true });
    case 'price_asc':
      return query.order('regular_price', { ascending: true });
    case 'price_desc':
      return query.order('regular_price', { ascending: false });
    case 'popular':
      return query.order('total_sold', { ascending: false });
    case 'rating':
      return query.order('average_rating', { ascending: false });
    default:
      return query.order('created_at', { ascending: false });
  }
}

// ---- Service Functions ----

/**
 * Get paginated products with filters.
 */
export async function getProducts(
  options: GetProductsOptions = {}
): Promise<PaginatedResponse<Product>> {
  const {
    page = 1,
    pageSize = 12,
    categorySlug,
    search,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    inStock,
    featured,
  } = options;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  if (isSupabaseConfigured) {
    try {
      const selectClause = categorySlug
        ? `*, category:categories!category_id!inner(id, name, slug), images:product_images(id, url, alt_text, display_order, is_primary)`
        : PRODUCT_LIST_SELECT;

      let query = supabase
        .from('products')
        .select(selectClause, { count: 'exact' })
        .eq('status', 'active');

      if (categorySlug) {
        query = query.eq('category.slug', categorySlug);
      }

      if (search) {
        query = query.ilike('name', `%${search}%`);
      }

      if (minPrice !== undefined) {
        query = query.gte('regular_price', minPrice);
      }

      if (maxPrice !== undefined) {
        query = query.lte('regular_price', maxPrice);
      }

      if (inStock === true) {
        query = query.gt('stock_quantity', 0);
      }

      if (featured !== undefined) {
        query = query.eq('is_featured', featured);
      }

      query = applySorting(query, sortBy);
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (!error && data !== null) {
        const totalCount = count ?? data.length;
        return {
          data: (data as unknown as Product[]) ?? [],
          count: totalCount,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        };
      }
    } catch (err) {
      console.warn('Falling back to demo products:', err);
    }
  }

  // Fallback to DEMO_PRODUCTS with client-side filtering
  let filtered = [...DEMO_PRODUCTS];

  if (categorySlug) {
    filtered = filtered.filter(
      (p) =>
        p.category?.slug === categorySlug ||
        p.category_id === categorySlug ||
        p.category?.id === categorySlug
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.short_description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    );
  }

  if (minPrice !== undefined) {
    filtered = filtered.filter((p) => p.regular_price >= minPrice);
  }

  if (maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.regular_price <= maxPrice);
  }

  if (featured !== undefined) {
    filtered = filtered.filter((p) => p.is_featured === featured);
  }

  if (sortBy === 'price_asc') {
    filtered.sort((a, b) => a.regular_price - b.regular_price);
  } else if (sortBy === 'price_desc') {
    filtered.sort((a, b) => b.regular_price - a.regular_price);
  } else if (sortBy === 'popular') {
    filtered.sort((a, b) => b.total_sold - a.total_sold);
  }

  const paginated = filtered.slice(from, to + 1);

  return {
    data: paginated,
    count: filtered.length,
    page,
    pageSize,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

/**
 * Get a single product by slug with full details.
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_DETAIL_SELECT)
        .eq('slug', slug)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        return data as unknown as Product;
      }
    } catch (err) {
      console.warn('Supabase product slug lookup fallback:', err);
    }
  }

  const found = DEMO_PRODUCTS.find((p) => p.slug === slug);
  if (found) return found;

  return DEMO_PRODUCTS[0]!;
}

/**
 * Get a single product by ID with full details.
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DETAIL_SELECT)
      .eq('id', id)
      .single();

    if (!error && data) {
      return data as unknown as Product;
    }
  } catch (err) {
    console.warn('Supabase product ID lookup fallback:', err);
  }

  const found = DEMO_PRODUCTS.find((p) => p.id === id);
  if (found) return found;

  return DEMO_PRODUCTS[0]!;
}

/**
 * Get featured products.
 */
export async function getFeaturedProducts(limit: number = 8): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data as unknown as Product[]) ?? [];
      }
    } catch (err) {
      console.warn('Featured products fallback:', err);
    }
  }

  return DEMO_PRODUCTS.filter((p) => p.is_featured).slice(0, limit);
}

/**
 * Get latest active products.
 */
export async function getLatestProducts(limit: number = 8): Promise<Product[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(PRODUCT_LIST_SELECT)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data as unknown as Product[]) ?? [];
      }
    } catch (err) {
      console.warn('Latest products fallback:', err);
    }
  }

  return DEMO_PRODUCTS.slice(0, limit);
}

/**
 * Get related products by category, excluding the given product.
 */
export async function getRelatedProducts(
  productId: string,
  categoryId: string,
  limit: number = 4
): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('status', 'active')
      .eq('category_id', categoryId)
      .neq('id', productId)
      .order('total_sold', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return (data as unknown as Product[]) ?? [];
    }
  } catch (err) {
    console.warn('Related products fallback:', err);
  }

  return DEMO_PRODUCTS.filter((p) => p.id !== productId).slice(0, limit);
}

/**
 * Search products using text search.
 */
export async function searchProducts(
  query: string,
  limit: number = 10
): Promise<Product[]> {
  const searchTerm = query.trim().toLowerCase();
  if (!searchTerm) return [];

  try {
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT)
      .eq('status', 'active')
      .or(`name.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('total_sold', { ascending: false })
      .limit(limit);

    if (!error && data && data.length > 0) {
      return (data as unknown as Product[]) ?? [];
    }
  } catch (err) {
    console.warn('Search fallback:', err);
  }

  return DEMO_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.short_description?.toLowerCase().includes(searchTerm) ||
      p.sku?.toLowerCase().includes(searchTerm)
  ).slice(0, limit);
}
