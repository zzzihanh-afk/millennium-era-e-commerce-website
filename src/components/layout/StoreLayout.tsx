import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { getCategories } from '@/services/categories';
import { DEMO_CATEGORIES } from '@/lib/demoData';
import type { Category } from '@/types';

export const StoreLayout: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);

  useEffect(() => {
    getCategories()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => console.warn('Failed to load categories for layout:', err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 selection:bg-brand-red selection:text-white">
      <Header categories={categories} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
};
