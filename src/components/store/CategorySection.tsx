import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shirt,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Watch,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import type { Category } from '@/types';

interface CategorySectionProps {
  categories: Category[];
  isLoading?: boolean;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  fashion: <Shirt className="w-7 h-7 text-brand-red" />,
  electronics: <Smartphone className="w-7 h-7 text-blue-600" />,
  'home-living': <Home className="w-7 h-7 text-amber-600" />,
  'beauty-health': <Sparkles className="w-7 h-7 text-pink-600" />,
  'sports-fitness': <Dumbbell className="w-7 h-7 text-green-600" />,
  'toys-games': <Gamepad2 className="w-7 h-7 text-purple-600" />,
  accessories: <Watch className="w-7 h-7 text-brand-gold-dark" />,
};

export const CategorySection: React.FC<CategorySectionProps> = ({
  categories,
  isLoading = false,
}) => {
  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-brand-red rounded-full" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs sm:text-sm font-semibold text-brand-red hover:text-brand-red-dark flex items-center gap-1 group transition"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center space-y-2 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-gray-200" />
                <div className="h-3 w-14 bg-gray-200 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6">
            {categories.slice(0, 7).map((category) => {
              const iconElement =
                ICON_MAP[category.slug] || <Shirt className="w-7 h-7 text-brand-red" />;

              return (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="flex flex-col items-center text-center group transition"
                >
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-white border-2 border-brand-gold/70 shadow-sm flex items-center justify-center p-2.5 overflow-hidden transition-all duration-300 group-hover:border-brand-gold group-hover:shadow-md group-hover:scale-105 group-hover:bg-amber-50/20">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          // Hide image and let icon display
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      iconElement
                    )}
                  </div>
                  <span className="mt-2.5 text-xs font-semibold text-gray-800 group-hover:text-brand-red transition truncate w-full px-1">
                    {category.name}
                  </span>
                </Link>
              );
            })}

            {/* "More" Card - Matching Mockup 2 */}
            <Link
              to="/shop"
              className="flex flex-col items-center text-center group transition"
            >
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-brand-red border-2 border-brand-red flex items-center justify-center text-white shadow-sm transition-all duration-300 group-hover:bg-brand-red-dark group-hover:scale-105">
                <MoreHorizontal className="w-8 h-8 text-white" />
              </div>
              <span className="mt-2.5 text-xs font-semibold text-gray-800 group-hover:text-brand-red transition">
                More
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
