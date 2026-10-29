// ============================================================
// Millennium Era — Category Service
// ============================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type {
  Category,
  Product,
  PaginatedResponse,
} from '@/types';

import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demoData';

const CATEGORY_SELECT = `*`;

const PRODUCT_LIST_SELECT = `
  *,
  category:categories!category_id(id, name, slug),
  images:product_images(id, url, alt_text, display_order, is_primary)
`;

// ---- Service Functions ----

/**
 * Get all active categories with their children, ordered by display_order.
 */
export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) {
    return DEMO_CATEGORIES;
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      const categories = data as Category[];
      const map = new Map<string, Category>();
      const roots: Category[] = [];

      for (const cat of categories) {
        cat.children = [];
        map.set(cat.id, cat);
      }

      for (const cat of categories) {
        if (cat.parent_id && map.has(cat.parent_id)) {
          map.get(cat.parent_id)!.children!.push(cat);
        } else {
          roots.push(cat);
        }
      }

      return roots;
    }
  } catch (err) {
    console.warn('Falling back to demo categories:', err);
  }

  return DEMO_CATEGORIES;
}

/**
 * Get a single category by slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category> {
  if (!isSupabaseConfigured) {
    const match = DEMO_CATEGORIES.find((c) => c.slug === slug);
    if (match) return match;
    throw new Error(`Category not found: ${slug}`);
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select(CATEGORY_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!error && data) {
      return data as Category;
    }
  } catch {
    // fallback
  }

  const demoMatch = DEMO_CATEGORIES.find((c) => c.slug === slug);
  if (demoMatch) {
    return demoMatch;
  }

  throw new Error(`Category not found: ${slug}`);
}

/**
 * Get products in a category by slug, with pagination.
 */
export async function getCategoryProducts(
  slug: string,
  options: {
    page?: number;
    pageSize?: number;
    sortBy?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<PaginatedResponse<Product>> {
  const {
    page = 1,
    pageSize = 12,
    sortBy = 'newest',
    inStock,
    minPrice,
    maxPrice,
  } = options;

  // First, get the category id from slug
  const category = await getCategoryBySlug(slug);

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('products')
      .select(PRODUCT_LIST_SELECT, { count: 'exact' })
      .eq('status', 'active')
      .eq('category_id', category.id);

    if (inStock === true) {
      query = query.gt('stock_quantity', 0);
    }

    if (minPrice !== undefined) {
      query = query.gte('regular_price', minPrice);
    }

    if (maxPrice !== undefined) {
      query = query.lte('regular_price', maxPrice);
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'price_asc':
        query = query.order('regular_price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('regular_price', { ascending: false });
        break;
      case 'popular':
        query = query.order('total_sold', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
    }

    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data && data.length > 0) {
      const totalCount = count ?? data.length;
      return {
        data: (data as unknown as Product[]) ?? [],
        count: totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    }
  } catch (err) {
    console.warn('Falling back to demo category products:', err);
  }

  // Demo fallback
  let list = DEMO_PRODUCTS.filter((p) => p.category_id === category.id || p.category?.slug === slug);
  if (inStock === true) {
    list = list.filter((p) => p.stock_quantity > 0);
  }
  if (minPrice !== undefined) {
    list = list.filter((p) => (p.sale_price ?? p.regular_price) >= minPrice);
  }
  if (maxPrice !== undefined) {
    list = list.filter((p) => (p.sale_price ?? p.regular_price) <= maxPrice);
  }

  const from = (page - 1) * pageSize;
  const paged = list.slice(from, from + pageSize);

  return {
    data: paged,
    count: list.length,
    page,
    pageSize,
    totalPages: Math.ceil(list.length / pageSize),
  };
}
