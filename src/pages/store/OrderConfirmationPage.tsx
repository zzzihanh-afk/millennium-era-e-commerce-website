import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  ArrowRight,
  Printer,
  ShoppingBag,
  Clock,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { PAYMENT_METHOD_NAMES } from '@/lib/constants';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const state = location.state as {
    orderNumber?: string;
    totalAmount?: number;
    paymentMethod?: string;
    shippingAddress?: any;
    transactionId?: string;
  } || {};

  return (
    <div className="bg-gray-50/70 min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4">
        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm text-center">
          {/* Success Check Icon */}
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-brand-gold-dark">
            Order Placed Successfully
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 mb-3">
            Thank You For Shopping with Millennium Era!
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
            Your order has been recorded in our system. We will contact you shortly to confirm
            delivery.
          </p>

          {/* Order Details Badge Box */}
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl max-w-lg mx-auto text-left space-y-3 mb-8 text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <span className="text-gray-500 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-brand-red text-sm">
                #{orderNumber || state.orderNumber || 'ME10248'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Payment Method:</span>
              <span className="font-semibold text-gray-900">
                {PAYMENT_METHOD_NAMES[state.paymentMethod || 'cod'] || 'Cash on Delivery'}
              </span>
            </div>

            {state.transactionId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Transaction ID (TrxID):</span>
                <span className="font-mono font-semibold text-gray-900">
                  {state.transactionId}
                </span>
              </div>
            )}

            {state.totalAmount && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-700 font-bold">Total Amount:</span>
                <span className="font-bold text-gray-900 text-sm">
                  {formatPrice(state.totalAmount)}
                </span>
              </div>
            )}

            {state.shippingAddress && (
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500 font-medium block mb-1">Delivering to:</span>
                <p className="text-gray-800 font-medium">
                  {state.shippingAddress.full_name} ({state.shippingAddress.phone})
                </p>
                <p className="text-gray-600">
                  {state.shippingAddress.address_line1}, {state.shippingAddress.city}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/orders">
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-1.5"
              >
                <Package className="w-4 h-4" />
                <span>Track My Orders</span>
              </Button>
            </Link>

            <Link to="/shop">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-6 flex items-center gap-2">
                <span>Continue Shopping</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
