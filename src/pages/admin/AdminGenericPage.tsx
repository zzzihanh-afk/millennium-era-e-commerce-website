import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sliders, Layers, Truck, Star, Tag, Share2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdminGenericPage: React.FC = () => {
  const location = useLocation();
  const path = location.pathname.split('/').pop() || 'management';

  const titleMap: Record<string, { title: string; subtitle: string; icon: any }> = {
    attributes: {
      title: 'Product Attributes',
      subtitle: 'Manage global attributes (Size, Color, Material, Storage) and their swatch values.',
      icon: Sliders,
    },
    variations: {
      title: 'Product Variations Builder',
      subtitle: 'Configure SKU combinations, individual stock levels, and variation-specific prices.',
      icon: Layers,
    },
    shipping: {
      title: 'Shipping Zones & Couriers',
      subtitle: 'Configure Inside Dhaka / Outside Dhaka rates and free delivery thresholds.',
      icon: Truck,
    },
    reviews: {
      title: 'Customer Reviews Moderation',
      subtitle: 'Review verified buyer ratings and approve testimonials.',
      icon: Star,
    },
    coupons: {
      title: 'Coupons & Promo Codes',
      subtitle: 'Create percentage or fixed-amount discount codes and minimum spend caps.',
      icon: Tag,
    },
    social: {
      title: 'Social Media Links',
      subtitle: 'Manage links for Facebook, Instagram, YouTube, and TikTok displayed on the storefront.',
      icon: Share2,
    },
    staff: {
      title: 'Staff Roles & Permissions',
      subtitle: 'Assign Super Admin, Admin, Order Manager, Inventory Manager, and Support Agent roles.',
      icon: UserCheck,
    },
  };

  const meta = titleMap[path] || {
    title: 'Management Portal',
    subtitle: 'Manage store records and operations.',
    icon: Sliders,
  };

  const Icon = meta.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Icon className="w-6 h-6 text-brand-red" />
            <span>{meta.title}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">{meta.subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-brand-red flex items-center justify-center mx-auto">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">{meta.title} Active</h3>
        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          Integrated with Supabase database schema and RLS policies. Configure this section via database migrations or direct store setting records.
        </p>
      </div>
    </div>
  );
};
