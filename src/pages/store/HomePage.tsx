import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { CategorySection } from '@/components/store/CategorySection';
import { ProductGrid } from '@/components/store/ProductGrid';
import { NewsletterSection } from '@/components/store/NewsletterSection';
import { getCategories } from '@/services/categories';
import { getLatestProducts, getFeaturedProducts } from '@/services/products';
import type { Category, Product } from '@/types';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from '@/lib/demoData';

export const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [latestProducts, setLatestProducts] = useState<Product[]>(DEMO_PRODUCTS.slice(0, 8));
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(
    DEMO_PRODUCTS.filter((p) => p.is_featured).slice(0, 4)
  );
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, latest, featured] = await Promise.all([
          getCategories(),
          getLatestProducts(8),
          getFeaturedProducts(4),
        ]);
        if (cats && cats.length > 0) setCategories(cats);
        if (latest && latest.length > 0) setLatestProducts(latest);
        if (featured && featured.length > 0) setFeaturedProducts(featured);
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-0">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Shop by Category */}
      <CategorySection categories={categories} isLoading={loading} />

      {/* 3. Latest Products */}
      <ProductGrid
        title="Latest Products"
        subtitle="Newly arrived fashion, electronics, and lifestyle pieces"
        viewAllLink="/shop?sort=newest"
        products={latestProducts}
        isLoading={loading}
      />

      {/* 4. Luxury Promotional Mid-Banner */}
      <section className="py-12 bg-gray-50 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900 via-neutral-800 to-black p-8 sm:p-12 text-white shadow-xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SEASONAL SPOTLIGHT</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Authentic Luxury, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
                  Delivered Direct in BD
                </span>
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Enjoy hassle-free Cash on Delivery and verified bKash, Nagad, and Rocket
                payments with rapid doorstep delivery inside and outside Dhaka.
              </p>
              <div className="pt-2">
                <Link to="/shop">
                  <Button className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-6 py-2.5 rounded-md flex items-center gap-2">
                    <span>Shop All Categories</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured Products */}
      {featuredProducts.length > 0 && (
        <ProductGrid
          title="Featured Collection"
          subtitle="Customer favorites and editor's top recommendations"
          viewAllLink="/shop?featured=true"
          products={featuredProducts}
          isLoading={loading}
        />
      )}

      {/* 6. Newsletter Subscription */}
      <NewsletterSection />
    </div>
  );
};
