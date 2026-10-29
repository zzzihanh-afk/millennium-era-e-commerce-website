import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ProductCard } from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/services/products';
import { getCategories } from '@/services/categories';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demoData';
import type { Product, Category } from '@/types';
import { Filter, SlidersHorizontal, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export const ShopPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Active category: route slug takes precedence, or category search query
  const categorySlug = slug || searchParams.get('category') || undefined;

  // Filters state from URL or defaults
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('search') || undefined;
  const sortBy = (searchParams.get('sort') as any) || 'newest';
  const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined;

  const pageSize = 12;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.warn('Categories load error:', err));
  }, []);

  useEffect(() => {
    async function fetchCatalog() {
      setLoading(true);
      try {
        const response = await getProducts({
          page,
          pageSize,
          categorySlug,
          search: searchQuery,
          sortBy,
          minPrice,
          maxPrice,
        });
        setProducts(response.data);
        setTotalCount(response.count);
      } catch (err) {
        console.error('Failed to load shop products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCatalog();
  }, [page, categorySlug, searchQuery, sortBy, minPrice, maxPrice]);

  const handleCategoryClick = (targetSlug: string | null) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('category'); // Clean up redundant search param
    nextParams.delete('page');     // Reset to page 1

    const qs = nextParams.toString() ? `?${nextParams.toString()}` : '';

    if (!targetSlug) {
      navigate(`/shop${qs}`);
    } else {
      navigate(`/category/${targetSlug}${qs}`);
    }
  };

  const updateFilter = (key: string, value: string | null) => {
    if (key === 'category') {
      handleCategoryClick(value);
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    nextParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(nextParams);
  };

  return (
    <div className="bg-gray-50/60 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb / Title */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : categorySlug
              ? `Category: ${categories.find((c) => c.slug === categorySlug)?.name || categorySlug}`
              : 'All Products'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Showing {products.length} of {totalCount} luxury items
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-gray-900 text-sm">
                <SlidersHorizontal className="w-4 h-4 text-brand-red" />
                <span>Filter & Refine</span>
              </div>

              {/* Category Filter */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Category
                </h4>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleCategoryClick(null)}
                    className={`block w-full text-left px-2.5 py-1.5 rounded text-xs transition cursor-pointer font-medium ${
                      !categorySlug
                        ? 'bg-red-50 text-brand-red font-bold shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.slug)}
                      className={`block w-full text-left px-2.5 py-1.5 rounded text-xs transition cursor-pointer font-medium ${
                        categorySlug === cat.slug
                          ? 'bg-red-50 text-brand-red font-bold shadow-xs'
                          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                  Price (BDT ৳)
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      updateFilter('minPrice', null);
                      updateFilter('maxPrice', '100000'); // ৳1,000 in paisa
                    }}
                    className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-brand-red"
                  >
                    Under ৳1,000
                  </button>
                  <button
                    onClick={() => {
                      updateFilter('minPrice', '100000');
                      updateFilter('maxPrice', '300000'); // ৳1,000 - ৳3,000
                    }}
                    className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-brand-red"
                  >
                    ৳1,000 — ৳3,000
                  </button>
                  <button
                    onClick={() => {
                      updateFilter('minPrice', '300000');
                      updateFilter('maxPrice', '600000'); // ৳3,000 - ৳6,000
                    }}
                    className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-brand-red"
                  >
                    ৳3,000 — ৳6,000
                  </button>
                  <button
                    onClick={() => {
                      updateFilter('minPrice', '600000');
                      updateFilter('maxPrice', null); // ৳6,000+
                    }}
                    className="block w-full text-left px-2 py-1 text-xs text-gray-600 hover:text-brand-red"
                  >
                    ৳6,000 & Above
                  </button>
                </div>
              </div>

              {/* Clear Filters */}
              {(categorySlug || searchQuery || minPrice || maxPrice) && (
                <div className="pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/shop')}
                    className="w-full text-xs text-gray-600 hover:text-brand-red border-dashed cursor-pointer"
                  >
                    Reset All Filters
                  </Button>
                </div>
              )}
            </div>
          </aside>

          {/* Product Grid & Sorting */}
          <main className="lg:col-span-3 space-y-6">
            {/* Sorting Header */}
            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-gray-600 font-medium">
                Showing <strong className="text-gray-900">{products.length}</strong> products
              </span>

              <div className="flex items-center gap-2">
                <label htmlFor="sortSelect" className="text-xs text-gray-500 whitespace-nowrap">
                  Sort By:
                </label>
                <select
                  id="sortSelect"
                  value={sortBy}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="text-xs border border-gray-300 rounded px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-red"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Products Listing */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-lg p-4 space-y-3 animate-pulse"
                  >
                    <div className="w-full pt-[100%] bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="h-8 bg-gray-100 rounded mt-4" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
                <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800">No products match your criteria</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your filters or clearing search terms to explore available items.
                </p>
                <Button
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="mt-4 bg-brand-red hover:bg-brand-red-dark text-white text-xs"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateFilter('page', (page - 1).toString())}
                  className="text-xs flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>

                <span className="text-xs text-gray-600 font-medium">
                  Page <strong className="text-gray-900">{page}</strong> of{' '}
                  <strong className="text-gray-900">{totalPages}</strong>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateFilter('page', (page + 1).toString())}
                  className="text-xs flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
