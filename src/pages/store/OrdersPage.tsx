import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOrders } from '@/services/orders';
import { formatPrice, formatDate, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/lib/utils';
import { PAYMENT_METHOD_NAMES } from '@/lib/constants';
import type { Order } from '@/types';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getMyOrders()
        .then((res) => setOrders(res.data))
        .catch((err) => console.warn('Could not load orders:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="bg-gray-50/70 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Order History & Tracking
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review your past purchases, shipment statuses, and payment verifications.
            </p>
          </div>
          <Link to="/shop">
            <Button variant="outline" size="sm" className="text-xs">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {!user ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md mx-auto">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Please sign in to view your orders
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Track real-time shipment updates and download invoice receipts.
            </p>
            <Link to="/login">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6">
                Login to Account
              </Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-gray-100 rounded w-1/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-16 bg-gray-50 rounded" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">You haven't placed any orders yet</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-6">
              When you complete a purchase, your order history and tracking will appear here.
            </p>
            <Link to="/shop">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6">
                Explore The Shop
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status] || {
                label: order.status,
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
              };
              const payCfg = PAYMENT_STATUS_CONFIG[order.payment_status] || {
                label: order.payment_status,
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
              };

              return (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">
                          Order Number
                        </span>
                        <span className="font-mono font-bold text-gray-900 text-sm">
                          #{order.order_number}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">
                          Order Date
                        </span>
                        <span className="font-semibold text-gray-700">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px] uppercase font-bold">
                          Total Amount
                        </span>
                        <span className="font-bold text-brand-red text-sm">
                          {formatPrice(order.total_amount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Fulfillment Status */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusCfg.bgColor} ${statusCfg.color}`}
                      >
                        {statusCfg.label}
                      </span>
                      {/* Payment Status */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${payCfg.bgColor} ${payCfg.color}`}
                      >
                        {payCfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-4 sm:p-6 divide-y divide-gray-100">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image_url || '/assets/logo.png'}
                            alt={item.product_name}
                            className="w-12 h-12 object-contain bg-gray-50 rounded border border-gray-200 p-1"
                          />
                          <div>
                            <h4 className="font-bold text-gray-900">{item.product_name}</h4>
                            {item.variant_name && (
                              <p className="text-gray-500 text-[11px]">{item.variant_name}</p>
                            )}
                            <p className="text-gray-500 text-[10px]">
                              Qty: {item.quantity} × {formatPrice(item.unit_price)}
                            </p>
                          </div>
                        </div>

                        <span className="font-bold text-gray-900">
                          {formatPrice(item.line_total)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span>
                        Method:{' '}
                        <strong>
                          {PAYMENT_METHOD_NAMES[order.payment_method] || order.payment_method}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span>
                        Estimated Delivery:{' '}
                        <strong>{order.estimated_delivery || '3-7 business days'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
