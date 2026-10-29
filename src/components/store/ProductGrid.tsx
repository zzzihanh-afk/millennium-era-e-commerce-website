import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';

interface ProductGridProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
  isLoading?: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  title,
  subtitle,
  viewAllLink,
  products,
  isLoading = false,
}) => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-brand-red rounded-full" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>

          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="text-xs sm:text-sm font-semibold text-brand-red hover:text-brand-red-dark flex items-center gap-1 group transition"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-4 animate-pulse"
              >
                <div className="w-full pt-[100%] bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-8 bg-gray-200 rounded w-full mt-4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <PackageOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No products available</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Check back soon as we add new stock and special collection arrivals.
            </p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
