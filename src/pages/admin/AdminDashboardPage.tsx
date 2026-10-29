import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Coins,
  Users,
  Box,
  AlertTriangle,
  EyeOff,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle2,
  Bell,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, formatDateTime, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/utils';
import { getDashboardMetrics } from '@/services/admin';
import type { DashboardMetrics } from '@/types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const SALES_TREND_DATA = [
  { date: 'Oct 21', sales: 24000 },
  { date: 'Oct 22', sales: 28500 },
  { date: 'Oct 23', sales: 23000 },
  { date: 'Oct 24', sales: 34000 },
  { date: 'Oct 25', sales: 41000 },
  { date: 'Oct 26', sales: 48000 },
  { date: 'Oct 27', sales: 52000 },
  { date: 'Oct 28', sales: 68450 },
];

const CATEGORY_COLORS = ['#E50914', '#D4AF37', '#6366F1', '#10B981', '#EC4899', '#64748B'];

export const AdminDashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetrics)
      .catch((err) => console.warn('Dashboard load error:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Header with Title & Date Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-gray-700 font-semibold">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>Oct 28, 2025 - Oct 28, 2025</span>
        </div>
      </div>

      {/* 2. Key Metrics 6-Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Total Orders</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {metrics?.totalOrders || 1248}
            </p>
            <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 12% vs last 7 days</span>
            </p>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Total Sales</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {formatPrice(metrics?.totalSales || 41286000)}
            </p>
            <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 18% vs last 7 days</span>
            </p>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Total Customers</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {metrics?.totalCustomers || 532}
            </p>
            <p className="text-[10px] text-green-600 font-bold mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 7% vs last 7 days</span>
            </p>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Pending Orders</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {metrics?.pendingOrders || 24}
            </p>
            <p className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-0.5">
              <span>↑ 3% vs last 7 days</span>
            </p>
          </div>
        </div>

        {/* Low Stock Products */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Low Stock Products</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {metrics?.lowStockProducts || 8}
            </p>
            <p className="text-[10px] text-orange-600 font-bold mt-1">
              <span>↑ 2% vs last 7 days</span>
            </p>
          </div>
        </div>

        {/* Out of Stock Products */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
              <EyeOff className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Out of Stock</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">
              {metrics?.outOfStockProducts || 3}
            </p>
            <p className="text-[10px] text-gray-400 font-medium mt-1">
              <span>0% vs last 7 days</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Middle Charts & Feeds Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Overview Chart (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Sales Overview</h3>
              <p className="text-[11px] text-gray-500">Revenue trends over time</p>
            </div>
            <select className="text-xs border border-gray-300 rounded px-2.5 py-1 bg-gray-50">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E50914" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#E50914" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `৳${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [`৳${val.toLocaleString()}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#17191F', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#E50914"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Category Donut (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Sales by Category</h3>
            <p className="text-[11px] text-gray-500">Volume share by department</p>
          </div>

          <div className="h-44 flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.salesByCategory || [
                    { category: 'Fashion', percentage: 32 },
                    { category: 'Electronics', percentage: 21 },
                    { category: 'Home & Living', percentage: 15 },
                    { category: 'Sports', percentage: 12 },
                    { category: 'Beauty', percentage: 8 },
                    { category: 'Others', percentage: 12 },
                  ]}
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="percentage"
                >
                  {CATEGORY_COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Share']}
                  contentStyle={{ backgroundColor: '#17191F', borderRadius: '6px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-600">
            {(metrics?.salesByCategory || [
              { category: 'Fashion', percentage: 32 },
              { category: 'Electronics', percentage: 21 },
              { category: 'Home & Living', percentage: 15 },
              { category: 'Sports', percentage: 12 },
              { category: 'Beauty', percentage: 8 },
              { category: 'Others', percentage: 12 },
            ]).map((item, idx) => (
              <div key={item.category} className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                />
                <span className="truncate">{item.category}</span>
                <span className="font-bold text-gray-900 ml-auto">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Notifications (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-900">Recent Notifications</h3>
            <span className="text-[10px] font-bold text-brand-red cursor-pointer">View All</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-56">
            <div className="flex gap-2.5 items-start text-xs">
              <div className="w-7 h-7 rounded-full bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0 mt-0.5">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">New order #ME10248</p>
                <p className="text-[10px] text-gray-500">A customer placed a new order.</p>
                <span className="text-[9px] text-gray-400">5m ago</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start text-xs">
              <div className="w-7 h-7 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">Payment submitted</p>
                <p className="text-[10px] text-gray-500">bKash claim for #BK10247 is pending.</p>
                <span className="text-[9px] text-gray-400">12m ago</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start text-xs">
              <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">New user registration</p>
                <p className="text-[10px] text-gray-500">A new customer has registered.</p>
                <span className="text-[9px] text-gray-400">18m ago</span>
              </div>
            </div>

            <div className="flex gap-2.5 items-start text-xs">
              <div className="w-7 h-7 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">Low stock alert</p>
                <p className="text-[10px] text-gray-500">Only 2 units left for Wireless Headphones.</p>
                <span className="text-[9px] text-gray-400">32m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Grid: Recent Orders (8 cols) + Sales by Payment Method & Low Stock (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Orders Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-brand-red hover:underline">
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3.5">#</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Product(s)</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Payment Method</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  {
                    num: 'ME10248',
                    customer: 'Rahat Islam',
                    email: 'rahat***@gmail.com',
                    prod: 'Running Shoes (+1 more)',
                    amount: 485000,
                    method: 'bKash',
                    status: 'pending_confirmation',
                    date: 'Oct 28, 2025 10:24 AM',
                  },
                  {
                    num: 'ME10247',
                    customer: 'Nusrat Jahan',
                    email: 'nusrat***@gmail.com',
                    prod: 'Ladies Handbag',
                    amount: 245000,
                    method: 'Nagad',
                    status: 'under_review',
                    date: 'Oct 28, 2025 09:58 AM',
                  },
                  {
                    num: 'ME10246',
                    customer: 'Tanzim Ahmed',
                    email: 'tanzim***@gmail.com',
                    prod: 'Smart Watch (+1 more)',
                    amount: 798000,
                    method: 'COD',
                    status: 'confirmed',
                    date: 'Oct 28, 2025 09:32 AM',
                  },
                  {
                    num: 'ME10245',
                    customer: 'Shanta Akter',
                    email: 'shanta***@gmail.com',
                    prod: 'Winter Jacket',
                    amount: 320000,
                    method: 'Rocket',
                    status: 'shipped',
                    date: 'Oct 28, 2025 08:45 AM',
                  },
                  {
                    num: 'ME10244',
                    customer: 'Fahim Rahman',
                    email: 'fahim***@gmail.com',
                    prod: 'Wireless Headphones',
                    amount: 199900,
                    method: 'Cash on Delivery',
                    status: 'delivered',
                    date: 'Oct 28, 2025 08:12 AM',
                  },
                ].map((row) => {
                  const cfg = ORDER_STATUS_CONFIG[row.status] || {
                    label: row.status,
                    bgColor: 'bg-gray-100',
                    color: 'text-gray-700',
                  };

                  return (
                    <tr key={row.num} className="hover:bg-gray-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-gray-900">{row.num}</td>
                      <td className="p-3.5">
                        <p className="font-semibold text-gray-900">{row.customer}</p>
                        <p className="text-[10px] text-gray-400">{row.email}</p>
                      </td>
                      <td className="p-3.5 text-gray-700">{row.prod}</td>
                      <td className="p-3.5 font-bold text-gray-900">{formatPrice(row.amount)}</td>
                      <td className="p-3.5 font-medium text-gray-600">{row.method}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bgColor} ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 text-[11px] whitespace-nowrap">{row.date}</td>
                      <td className="p-3.5 text-right">
                        <Link to="/admin/orders">
                          <Button size="sm" variant="outline" className="text-[11px] h-7 px-2.5">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Sales by Payment & Low Stock (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Sales by Payment Method */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Sales by Payment Method</h3>
              <Link to="/admin/payments" className="text-[10px] font-bold text-brand-red hover:underline">
                View Details →
              </Link>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Cash on Delivery', amount: 16854000, percent: 41, color: 'bg-amber-500' },
                { name: 'bKash', amount: 12486000, percent: 30, color: 'bg-pink-600' },
                { name: 'Nagad', amount: 6842000, percent: 17, color: 'bg-orange-500' },
                { name: 'Rocket', amount: 3478000, percent: 8, color: 'bg-purple-600' },
                { name: 'Others', amount: 1626000, percent: 4, color: 'bg-gray-400' },
              ].map((item) => (
                <div key={item.name} className="space-y-1 text-xs">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-bold text-gray-900">{formatPrice(item.amount)} ({item.percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Low Stock Products</h3>
              <Link to="/admin/inventory" className="text-[10px] font-bold text-brand-red hover:underline">
                View All →
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {[
                { name: 'Wireless Headphones', stock: 2 },
                { name: 'Smart Watch', stock: 3 },
                { name: 'Makeup Kit', stock: 5 },
                { name: 'Remote Control Car', stock: 6 },
                { name: 'Air Fryer', stock: 4 },
              ].map((item) => (
                <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-[10px] text-orange-600 font-bold">{item.stock} in stock</p>
                  </div>
                  <Link to="/admin/inventory">
                    <Button size="sm" className="bg-brand-red hover:bg-brand-red-dark text-white text-[10px] h-7 px-2.5 font-bold">
                      Restock
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
