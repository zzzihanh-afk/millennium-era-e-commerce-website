import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useAuth } from '@/contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isStaff, isLoading } = useAuth();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // If loading, show clean admin skeleton
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-brand-charcoal text-white">
        <div className="text-center space-y-4">
          <img src="/assets/logo.png" alt="Millennium Era" className="h-12 mx-auto animate-pulse" />
          <p className="text-xs text-brand-gold font-semibold tracking-wider uppercase">
            Loading Administrative Portal...
          </p>
        </div>
      </div>
    );
  }

  // If not logged in or not staff, redirect to login
  if (!user || !isStaff) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="h-screen flex bg-gray-100 overflow-hidden text-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 h-full">
            <AdminSidebar onCloseMobile={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AdminHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
