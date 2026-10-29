import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Package,
  Shield,
  Facebook,
  Instagram,
  Youtube,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { NAV_LINKS } from '@/lib/constants';
import { DEMO_CATEGORIES } from '@/lib/demoData';

interface HeaderProps {
  categories?: Array<{ id: string; name: string; slug: string; icon?: string | null }>;
}

export const Header: React.FC<HeaderProps> = ({ categories = [] }) => {
  const displayCategories = categories && categories.length > 0 ? categories : DEMO_CATEGORIES;
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isStaff, signOut } = useAuth();
  const { toggleCart, getItemCount, getSubtotal } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const itemCount = getItemCount();
  const subtotal = getSubtotal();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-40">
      {/* 1. TOP BAR (Dark Charcoal #17191F) */}
      <div className="bg-brand-charcoal text-white text-xs py-2 px-4 border-b border-gray-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Social Links & Support */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-300">
              <Phone className="w-3.5 h-3.5 text-brand-gold" />
              <span>Hotline: +880 1712 345678</span>
            </span>
            <div className="flex items-center gap-2.5 text-gray-400">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-gold transition"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-gold transition"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-brand-gold transition"
                aria-label="Youtube"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right side: Auth / Admin / Tagline */}
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-brand-gold font-medium tracking-wide">
              Shop Beyond Time
            </span>
            {isStaff && (
              <Link
                to="/admin"
                className="text-brand-gold hover:text-white flex items-center gap-1 font-semibold transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
            )}
            {!user ? (
              <div className="flex items-center gap-2">
                <Link to="/login" className="hover:text-brand-gold transition">
                  Login
                </Link>
                <span className="text-gray-600">/</span>
                <Link to="/register" className="hover:text-brand-gold transition">
                  Register
                </Link>
              </div>
            ) : (
              <span className="text-gray-300">
                Hi, <span className="text-white font-semibold">{profile?.full_name || 'Customer'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (White with Gold Bottom Accent) */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <img
            src="/assets/logo.png"
            alt="Millennium Era"
            className="h-11 sm:h-13 w-auto object-contain"
          />
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl mx-4 items-center"
        >
          <div className="relative w-full flex items-center">
            <input
              type="text"
              placeholder="Search for products, categories, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-12 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-l-md rounded-r-none focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red transition"
            />
            <Button
              type="submit"
              className="bg-brand-red hover:bg-brand-red-dark text-white rounded-l-none rounded-r-md px-5 h-[42px] transition"
              aria-label="Submit search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Right Actions: Wishlist, Cart, Account, Mobile Menu */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Wishlist */}
          <Link
            to={user ? '/wishlist' : '/login'}
            className="p-2 text-gray-700 hover:text-brand-red transition relative"
            aria-label="Wishlist"
          >
            <Heart className="w-6 h-6" />
          </Link>

          {/* Cart Icon + Button */}
          <button
            onClick={toggleCart}
            className="flex items-center gap-2.5 p-2 bg-red-50 hover:bg-red-100/80 text-brand-red rounded-lg transition group relative"
            aria-label="Open Shopping Cart"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-fade-in">
                  {itemCount}
                </span>
              )}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-[10px] font-medium text-gray-500 uppercase leading-none">
                Cart Total
              </span>
              <span className="text-xs font-bold text-gray-900 leading-tight">
                {formatPrice(subtotal)}
              </span>
            </div>
          </button>

          {/* Account Dropdown */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-1.5 p-2 text-gray-700 hover:text-brand-red transition rounded-md"
                  aria-label="Account menu"
                >
                  <UserIcon className="w-6 h-6" />
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-100">
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {profile?.full_name || 'My Account'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <DropdownMenuItem onClick={() => navigate('/account')} className="cursor-pointer">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Profile & Addresses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/orders')} className="cursor-pointer">
                  <Package className="w-4 h-4 mr-2" />
                  Order History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/wishlist')} className="cursor-pointer">
                  <Heart className="w-4 h-4 mr-2" />
                  My Wishlist
                </DropdownMenuItem>
                {isStaff && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer text-brand-gold font-medium"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-red-600 focus:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to="/login"
              className="hidden sm:flex items-center gap-1 p-2 text-gray-700 hover:text-brand-red transition"
            >
              <UserIcon className="w-6 h-6" />
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-brand-red transition"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 3. NAVIGATION BAR (Desktop) */}
      <div className="border-t border-b border-gray-200 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            {/* All Categories Dropdown button */}
            <DropdownMenu open={categoriesOpen} onOpenChange={setCategoriesOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold text-sm px-5 py-3 flex items-center gap-2 transition cursor-pointer select-none focus:outline-none"
                >
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                  <ChevronDown
                    className={`w-4 h-4 ml-1 transition-transform duration-200 ${
                      categoriesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={0}
                className="w-64 bg-white shadow-xl border border-gray-200 rounded-b-md py-2 z-50"
              >
                {displayCategories.map((cat) => (
                  <DropdownMenuItem
                    key={cat.id}
                    onClick={() => {
                      setCategoriesOpen(false);
                      navigate(`/category/${cat.slug}`);
                    }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-brand-red transition font-medium cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <span>{cat.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setCategoriesOpen(false);
                    navigate('/shop');
                  }}
                  className="block px-4 py-2 text-xs font-semibold text-brand-red hover:bg-red-50 cursor-pointer"
                >
                  View All Categories →
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Standard Nav Links */}
            <nav className="flex items-center ml-4 space-x-1">
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={`px-4 py-3 text-sm font-semibold transition border-b-2 ${
                      isActive
                        ? 'text-brand-red border-brand-red'
                        : 'text-gray-700 border-transparent hover:text-brand-red'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Highlight offer */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Free delivery in Dhaka over ৳5,000</span>
          </div>
        </div>
      </div>

      {/* 4. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top duration-200">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
            <Button
              type="submit"
              className="bg-brand-red text-white rounded-l-none rounded-r-md px-4 h-[38px]"
            >
              <Search className="w-4 h-4" />
            </Button>
          </form>

          {/* Mobile links */}
          <nav className="flex flex-col space-y-2 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-2 text-sm font-semibold text-gray-800 hover:text-brand-red transition rounded hover:bg-gray-50"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Categories list in mobile */}
          {displayCategories.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-2">
                Categories
              </p>
              <div className="grid grid-cols-2 gap-1">
                {displayCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2 py-1.5 text-xs text-gray-700 hover:text-brand-red truncate flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-brand-gold" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
