import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Settings,
  ExternalLink,
  Shield,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminHeaderProps {
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onToggleSidebar }) => {
  const { user, profile } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <input
            type="text"
            placeholder="Search anything (orders, customers, products)..."
            className="w-full text-xs bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-brand-red focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Right: Store Link, Notifications, Settings, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Link back to storefront */}
        <Link
          to="/"
          target="_blank"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-brand-red px-2.5 py-1.5 rounded-md hover:bg-gray-50 border border-gray-200 transition"
        >
          <span>View Store</span>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        </Link>

        {/* Notifications Bell */}
        <button
          className="relative p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </button>

        {/* Settings shortcut */}
        <Link
          to="/admin/settings"
          className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
          aria-label="Store Settings"
        >
          <Settings className="w-5 h-5" />
        </Link>

        <div className="h-6 w-px bg-gray-200" />

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-charcoal text-brand-gold font-bold text-xs flex items-center justify-center border-2 border-brand-gold/30">
            {profile?.full_name?.charAt(0) || 'A'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-gray-900 leading-tight">
              {profile?.full_name || 'Admin'}
            </p>
            <p className="text-[10px] text-brand-gold-dark font-semibold capitalize">
              {profile?.role?.replace('_', ' ') || 'Super Admin'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
