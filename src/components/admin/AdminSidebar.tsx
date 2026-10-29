import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  FolderTree,
  Sliders,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  CreditCard,
  Truck,
  Image as ImageIcon,
  Star,
  Tag,
  Share2,
  Settings,
  UserCheck,
  FileText,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  onCloseMobile?: () => void;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'User Management', path: '/admin/users', icon: Users, requiredPermission: 'customers.view' },
  { name: 'Fraud / Fake Order Prevention', path: '/admin/fraud', icon: ShieldAlert, requiredPermission: 'fraud.view' },
  { name: 'Categories', path: '/admin/categories', icon: FolderTree, requiredPermission: 'categories.manage' },
  { name: 'Attributes', path: '/admin/attributes', icon: Sliders, requiredPermission: 'products.manage' },
  { name: 'Products', path: '/admin/products', icon: Package, requiredPermission: 'products.view' },
  { name: 'Product Variations', path: '/admin/variations', icon: Layers, requiredPermission: 'products.manage' },
  { name: 'Inventory / Stock Management', path: '/admin/inventory', icon: Boxes, requiredPermission: 'inventory.manage' },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingBag, requiredPermission: 'orders.view' },
  { name: 'Payments', path: '/admin/payments', icon: CreditCard, requiredPermission: 'payments.view' },
  { name: 'Shipping', path: '/admin/shipping', icon: Truck, requiredPermission: 'shipping.view' },
  { name: 'Homepage / Banners', path: '/admin/banners', icon: ImageIcon, requiredPermission: 'banners.manage' },
  { name: 'Reviews', path: '/admin/reviews', icon: Star, requiredPermission: 'reviews.moderate' },
  { name: 'Coupons / Discounts', path: '/admin/coupons', icon: Tag, requiredPermission: 'coupons.manage' },
  { name: 'Social Links', path: '/admin/social', icon: Share2, requiredPermission: 'settings.manage' },
  { name: 'Store Settings', path: '/admin/settings', icon: Settings, requiredPermission: 'settings.view' },
  { name: 'Staff / Roles', path: '/admin/staff', icon: UserCheck, requiredPermission: 'staff.manage' },
  { name: 'Audit Logs', path: '/admin/audit', icon: FileText, requiredPermission: 'audit.view' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ onCloseMobile }) => {
  const { signOut, isSuperAdmin, hasAccess } = useAuth();

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.requiredPermission) return true;
    if (isSuperAdmin) return true;
    return hasAccess(item.requiredPermission);
  });

  return (
    <aside className="w-64 bg-brand-charcoal text-gray-300 flex flex-col h-full border-r border-gray-800 relative select-none">
      {/* 1. Header with Logo */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800/80">
        <NavLink to="/admin" className="flex items-center gap-2">
          <img
            src="/assets/logo.png"
            alt="Millennium Era"
            className="h-9 w-auto object-contain"
          />
        </NavLink>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items (Scrollable) */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-red text-white shadow-sm font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* 3. Bottom Logout & Brand Footnote */}
      <div className="p-3 border-t border-gray-800/80 relative overflow-hidden">
        {/* Red & Gold corner accent line */}
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-brand-red/20 via-brand-gold/10 to-transparent pointer-events-none" />

        <button
          onClick={signOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>

        <div className="mt-2 pt-2 border-t border-gray-800/50 flex items-center justify-between text-[10px] text-gray-500 px-1">
          <span className="font-semibold text-brand-gold">Millennium Era</span>
          <span>v1.0.0 PRO</span>
        </div>
      </div>
    </aside>
  );
};
