import React, { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/store/ProductGrid';
import { getProducts } from '@/services/products';
import type { Product } from '@/types';
import { Tag, Sparkles } from 'lucide-react';

export const OffersPage: React.FC = () => {
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts({ pageSize: 24, sortBy: 'newest' })
      .then((res) => {
        // Filter products with discounts
        const filtered = res.data.filter(
          (p) => p.sale_price !== null && p.sale_price < p.regular_price
        );
        setDiscountedProducts(filtered);
      })
      .catch((err) => console.warn('Offers load error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-50/60 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-red-900 via-brand-red to-red-800 p-8 sm:p-12 text-white shadow-xl mb-12 overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SPECIAL PROMOTIONS</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Exclusive Member Deals & Markdowns
            </h1>
            <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
              Save up to 40% on verified luxury footwear, premium timepieces, designer bags, and electronics.
            </p>
          </div>
        </div>

        <ProductGrid
          title="Discounted Items"
          subtitle="All active promotional prices currently available in Bangladesh"
          products={discountedProducts}
          isLoading={loading}
        />
      </div>
    </div>
  );
};
