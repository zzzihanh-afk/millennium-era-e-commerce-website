import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { getShippingZones, validateCoupon } from '@/services/store';
import type { ShippingZone } from '@/types';
import { toast } from 'sonner';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getShippingFee,
    getTotal,
    selectedShippingZone,
    setShippingZone,
    appliedCoupon,
    setCoupon,
  } = useCartStore();

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [couponInput, setCouponInput] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    getShippingZones().then((zones) => {
      setShippingZones(zones);
      if (zones.length > 0 && !selectedShippingZone) {
        setShippingZone(zones[0] || null);
      }
    });
  }, [selectedShippingZone, setShippingZone]);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shippingFee = getShippingFee();
  const total = getTotal();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setValidatingCoupon(true);
    try {
      const res = await validateCoupon(couponInput.trim(), subtotal);
      if (res.valid && res.coupon) {
        setCoupon(res.coupon);
        toast.success(`Coupon "${res.coupon.code}" applied successfully!`);
        setCouponInput('');
      } else {
        toast.error(res.error || 'Invalid or expired coupon code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    toast.info('Coupon removed');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-brand-red">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your Shopping Cart is Empty</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
          Explore our collection and discover high-quality apparel, electronics, and accessories.
        </p>
        <Link to="/shop">
          <Button className="bg-brand-red hover:bg-brand-red-dark text-white font-bold px-8 py-3 rounded-md shadow-md">
            Start Shopping Now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/60 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
          Shopping Cart ({items.reduce((acc, i) => acc + i.quantity, 0)} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Table: Cart Items (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || 'base'}`}
                  className="py-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between first:pt-0 last:pb-0"
                >
                  {/* Thumbnail & Title */}
                  <div className="flex gap-4 items-center">
                    <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                      <img
                        src={item.imageUrl || '/assets/logo.png'}
                        alt={item.productName}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {item.productName}
                      </h3>
                      {item.variantName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Variation: <span className="font-semibold text-gray-700">{item.variantName}</span>
                        </p>
                      )}
                      <p className="text-sm font-bold text-brand-red mt-1">
                        {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>

                  {/* Quantity & Total */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-gray-300 rounded-md bg-white">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        className="p-1.5 hover:bg-gray-100 text-gray-600 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        className="p-1.5 hover:bg-gray-100 text-gray-600 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-sm font-bold text-gray-900 min-w-[70px] text-right">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>

                    {/* Delete */}
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-gray-400 hover:text-brand-red p-1.5 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart Button */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
              <Link
                to="/shop"
                className="text-brand-red hover:underline font-semibold"
              >
                ← Continue Shopping
              </Link>
              <button
                onClick={clearCart}
                className="text-gray-500 hover:text-red-600 font-medium transition"
              >
                Clear Entire Cart
              </button>
            </div>
          </div>

          {/* Right Summary: Totals, Coupon, Checkout (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Coupon Application Box */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Tag className="w-4 h-4 text-brand-red" />
                <span>Have a Promo Coupon?</span>
              </div>

              {appliedCoupon ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                  <div className="flex items-center gap-2 text-green-800 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>{appliedCoupon.code} applied (-{formatPrice(discount)})</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-red-600 hover:underline font-bold"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-red uppercase"
                  />
                  <Button
                    type="submit"
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="bg-brand-charcoal hover:bg-black text-white text-xs font-semibold px-4 h-9"
                  >
                    {validatingCoupon ? 'Checking...' : 'Apply'}
                  </Button>
                </form>
              )}
            </div>

            {/* Order Summary Box */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-brand-red font-semibold">
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                {/* Delivery Zone Selector */}
                <div className="pt-2">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Shipping Destination:
                  </label>
                  <select
                    value={selectedShippingZone?.id || ''}
                    onChange={(e) => {
                      const zone = shippingZones.find((z) => z.id === e.target.value);
                      if (zone) setShippingZone(zone);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md p-2 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    {shippingZones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} ({formatPrice(zone.shipping_fee)}) — {zone.estimated_delivery}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between pt-1">
                  <span>Shipping Fee</span>
                  <span className="font-semibold text-gray-900">
                    {shippingFee === 0 ? (
                      <span className="text-green-600 font-bold uppercase text-[10px]">Free</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-black text-brand-red">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Checkout Button */}
              <Button
                onClick={() => navigate('/checkout')}
                className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold h-12 rounded-md shadow-md flex items-center justify-center gap-2 text-sm mt-4 transition"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
