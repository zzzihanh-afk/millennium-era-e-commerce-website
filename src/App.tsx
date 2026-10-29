import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreLayout } from '@/components/layout/StoreLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';

// Storefront Pages
import { HomePage } from '@/pages/store/HomePage';
import { ShopPage } from '@/pages/store/ShopPage';
import { ProductDetailPage } from '@/pages/store/ProductDetailPage';
import { CartPage } from '@/pages/store/CartPage';
import { CheckoutPage } from '@/pages/store/CheckoutPage';
import { OrderConfirmationPage } from '@/pages/store/OrderConfirmationPage';
import { OrdersPage } from '@/pages/store/OrdersPage';
import { AccountPage } from '@/pages/store/AccountPage';
import { WishlistPage } from '@/pages/store/WishlistPage';
import { AboutPage } from '@/pages/store/AboutPage';
import { ContactPage } from '@/pages/store/ContactPage';
import { OffersPage } from '@/pages/store/OffersPage';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminPaymentsPage } from '@/pages/admin/AdminPaymentsPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '@/pages/admin/AdminCategoriesPage';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminFraudPage } from '@/pages/admin/AdminFraudPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminBannersPage } from '@/pages/admin/AdminBannersPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { AdminStaffPage } from '@/pages/admin/AdminStaffPage';
import { AdminVariationsPage } from '@/pages/admin/AdminVariationsPage';
import { AdminSocialLinksPage } from '@/pages/admin/AdminSocialLinksPage';
import { AdminGenericPage } from '@/pages/admin/AdminGenericPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. Storefront Routes */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/category/:slug" element={<ShopPage />} />
        <Route path="/product/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* 2. Admin Console Routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="fraud" element={<AdminFraudPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="audit" element={<AdminAuditLogsPage />} />
        <Route path="attributes" element={<AdminGenericPage />} />
        <Route path="variations" element={<AdminVariationsPage />} />
        <Route path="shipping" element={<AdminGenericPage />} />
        <Route path="reviews" element={<AdminGenericPage />} />
        <Route path="coupons" element={<AdminGenericPage />} />
        <Route path="social" element={<AdminSocialLinksPage />} />
        <Route path="staff" element={<AdminStaffPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default App;
