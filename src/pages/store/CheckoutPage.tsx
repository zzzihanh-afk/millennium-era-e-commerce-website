import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  ArrowRight,
  User,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice, generateIdempotencyKey } from '@/lib/utils';
import { ALL_BD_DISTRICTS } from '@/lib/constants';
import { getShippingZones, getPaymentMethods } from '@/services/store';
import { createOrder, submitPaymentClaim } from '@/services/orders';
import type {
  ShippingZone,
  PaymentMethodSetting,
  PaymentMethodType,
  AddressSnapshot,
} from '@/types';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    items,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getShippingFee,
    getTotal,
    selectedShippingZone,
    setShippingZone,
    appliedCoupon,
  } = useCartStore();

  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSetting[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields (leave clean so users/admins can enter recipient details manually)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  // Payment Selection
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('cod');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [hasCopiedNumber, setHasCopiedNumber] = useState(false);

  // Load Shipping & Payment configs
  useEffect(() => {
    async function loadConfigs() {
      try {
        const [zones, methods] = await Promise.all([
          getShippingZones(),
          getPaymentMethods(),
        ]);
        setShippingZones(zones);
        setPaymentMethods(methods);

        if (zones.length > 0 && !selectedShippingZone) {
          setShippingZone(zones[0] || null);
        }
      } catch (err) {
        console.error('Failed to load checkout settings:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadConfigs();
  }, [selectedShippingZone, setShippingZone]);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shippingFee = getShippingFee();
  const total = getTotal();

  // Selected payment method settings from database
  const activeMethodConfig = paymentMethods.find((m) => m.method_type === selectedMethod);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isSubmitting) {
      navigate('/cart');
    }
  }, [items.length, isSubmitting, navigate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setHasCopiedNumber(true);
    toast.success('Number copied to clipboard!');
    setTimeout(() => setHasCopiedNumber(false), 3000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (!addressLine1.trim()) {
      toast.error('Please enter your detailed delivery address');
      return;
    }
    if (!selectedShippingZone) {
      toast.error('Please select a shipping zone');
      return;
    }

    // Manual payment validation
    if (selectedMethod !== 'cod') {
      if (!senderNumber.trim()) {
        toast.error(`Please enter the ${selectedMethod} phone number you sent payment from`);
        return;
      }
      if (!transactionId.trim()) {
        toast.error('Please enter the Transaction ID (TrxID)');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const shippingAddress: AddressSnapshot = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address_line1: addressLine1.trim(),
        address_line2: addressLine2.trim() || undefined,
        city: district,
        district,
        country: 'Bangladesh',
      };

      const idempotencyKey = generateIdempotencyKey();

      // 1. Submit atomic order to Supabase
      const result = await createOrder({
        items: items.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId,
          quantity: i.quantity,
        })),
        shipping_address: shippingAddress,
        payment_method: selectedMethod,
        coupon_code: appliedCoupon?.code,
        customer_notes: customerNotes.trim() || undefined,
        shipping_zone_id: selectedShippingZone.id,
        idempotency_key: idempotencyKey,
        guest_email: !user ? email.trim() || undefined : undefined,
        guest_phone: !user ? phone.trim() : undefined,
      });

      if (!result.success || !result.order_id) {
        throw new Error('Failed to create order. Please try again.');
      }

      // 2. If manual payment (bKash/Nagad/Rocket), submit payment claim
      if (selectedMethod !== 'cod') {
        await submitPaymentClaim(result.order_id, {
          payment_method: selectedMethod,
          sender_number: senderNumber.trim(),
          transaction_id: transactionId.trim().toUpperCase(),
          amount_claimed: total,
        });
      }

      // 3. Clear cart store
      clearCart();

      // 4. Navigate to confirmation screen
      navigate(`/order-confirmation/${result.order_number}`, {
        state: {
          orderNumber: result.order_number,
          totalAmount: total,
          paymentMethod: selectedMethod,
          shippingAddress,
          senderNumber,
          transactionId,
        },
      });

      toast.success('Order placed successfully!');
    } catch (err: any) {
      console.error('Order creation error:', err);
      toast.error(err.message || 'Error processing checkout. Please check stock and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50/70 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Checkout & Order Review
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Complete your shipping details and select your preferred payment method.
          </p>
        </div>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side: Delivery Details & Payment Method (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. SHIPPING ADDRESS */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <MapPin className="w-5 h-5 text-brand-red" />
                <h2 className="text-base font-bold text-gray-900">
                  1. Delivery Details (Bangladesh)
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Rahat Islam"
                    className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email (Optional for guests) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    autoComplete="off"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>

                {/* District */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    District / City <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={district}
                    onChange={(e) => {
                      setDistrict(e.target.value);
                      // Auto-switch shipping zone: Dhaka -> Inside Dhaka, others -> Outside Dhaka
                      if (e.target.value === 'Dhaka') {
                        const inside = shippingZones.find((z) => z.slug === 'inside-dhaka');
                        if (inside) setShippingZone(inside);
                      } else {
                        const outside = shippingZones.find((z) => z.slug === 'outside-dhaka');
                        if (outside) setShippingZone(outside);
                      }
                    }}
                    className="w-full text-xs border border-gray-300 rounded-md p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red"
                  >
                    {ALL_BD_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Street Address, House/Flat No, Area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="e.g. House #14, Road #5, Block C, Banani"
                  className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Order Instructions / Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Near City Bank ATM, please call before arriving"
                  className="w-full text-xs border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>
            </div>

            {/* 2. PAYMENT METHODS (Configured from Admin / DB) */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <CreditCard className="w-5 h-5 text-brand-red" />
                <h2 className="text-base font-bold text-gray-900">
                  2. Select Payment Method
                </h2>
              </div>

              {/* Payment Methods Radio Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash on Delivery */}
                <div
                  onClick={() => setSelectedMethod('cod')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'cod'
                      ? 'border-brand-red bg-red-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-brand-red">
                      {selectedMethod === 'cod' && (
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                      <p className="text-[10px] text-gray-500">Pay when delivered</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-700">৳0 fee</span>
                </div>

                {/* bKash */}
                <div
                  onClick={() => setSelectedMethod('bkash')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'bkash'
                      ? 'border-brand-red bg-red-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-brand-red">
                      {selectedMethod === 'bkash' && (
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-600">bKash</p>
                      <p className="text-[10px] text-gray-500">Send Money / Payment</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-pink-100 text-pink-700 font-bold px-1.5 py-0.5 rounded">
                    Popular
                  </span>
                </div>

                {/* Nagad */}
                <div
                  onClick={() => setSelectedMethod('nagad')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'nagad'
                      ? 'border-brand-red bg-red-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-brand-red">
                      {selectedMethod === 'nagad' && (
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-600">Nagad</p>
                      <p className="text-[10px] text-gray-500">Send Money</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                    Instant
                  </span>
                </div>

                {/* Rocket */}
                <div
                  onClick={() => setSelectedMethod('rocket')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition flex items-center justify-between ${
                    selectedMethod === 'rocket'
                      ? 'border-brand-red bg-red-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-brand-red">
                      {selectedMethod === 'rocket' && (
                        <div className="w-2 h-2 rounded-full bg-brand-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-600">Rocket</p>
                      <p className="text-[10px] text-gray-500">DBBL Mobile Banking</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                    Manual
                  </span>
                </div>
              </div>

              {/* MANUAL PAYMENT INSTRUCTIONS & VERIFICATION CLAIM FIELDS */}
              {selectedMethod !== 'cod' && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4 animate-in fade-in-50 duration-200">
                  <div className="flex items-start gap-2 text-xs text-gray-700">
                    <AlertCircle className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900">
                        How to pay via {activeMethodConfig?.display_name || selectedMethod.toUpperCase()}:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 mt-1 text-gray-600">
                        <li>
                          Open your {selectedMethod.toUpperCase()} mobile app or dial USSD.
                        </li>
                        <li>
                          Choose <strong>Send Money</strong> (or Make Payment if Merchant).
                        </li>
                        <li>
                          Enter recipient number:{' '}
                          <span className="font-mono font-bold text-brand-red text-sm">
                            {activeMethodConfig?.account_number || '+880 1712 345679'}
                          </span>{' '}
                          ({activeMethodConfig?.account_label || 'Merchant/Personal'})
                        </li>
                        <li>
                          Amount to send: <strong>{formatPrice(total)}</strong>
                        </li>
                        <li>Enter your PIN and complete transaction.</li>
                        <li>Copy the Transaction ID (TrxID) and enter it below.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Recipient Number Copy Box */}
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-400">
                        {selectedMethod.toUpperCase()} Recipient Number
                      </p>
                      <p className="text-sm font-mono font-extrabold text-gray-900">
                        {activeMethodConfig?.account_number || '01712-345679'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(activeMethodConfig?.account_number || '01712345679')
                      }
                      className="text-xs flex items-center gap-1 border-gray-300"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{hasCopiedNumber ? 'Copied!' : 'Copy'}</span>
                    </Button>
                  </div>

                  {/* Customer Sender Number & TrxID Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Your {selectedMethod.toUpperCase()} Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Transaction ID (TrxID) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                        placeholder="e.g. 9J4K2L8M"
                        className="w-full text-xs border border-gray-300 rounded-md p-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-red font-mono uppercase"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-500 italic">
                    Note: Never share your wallet PIN or OTP with anyone. Your order will be
                    verified by our finance team before shipment.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Order Summary & Place Order Button (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center justify-between">
                <span>Items in Order</span>
                <span className="text-xs font-normal text-gray-500">
                  {items.length} product(s)
                </span>
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || 'base'}`}
                    className="py-3 flex gap-3 items-center justify-between first:pt-0 last:pb-0 text-xs"
                  >
                    <div className="flex gap-2.5 items-center min-w-0">
                      <img
                        src={item.imageUrl || '/assets/logo.png'}
                        alt={item.productName}
                        className="w-10 h-10 object-contain rounded border border-gray-200 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-gray-500 text-[10px]">
                          Qty: {item.quantity}{' '}
                          {item.variantName ? `• ${item.variantName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 whitespace-nowrap">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Cost Breakdown */}
              <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
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

                <div className="flex justify-between">
                  <span>Shipping ({selectedShippingZone?.name || 'Standard'})</span>
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
                <span className="text-sm font-bold text-gray-900">Total Payable</span>
                <span className="text-2xl font-black text-brand-red">
                  {formatPrice(total)}
                </span>
              </div>

              {/* Place Order CTA */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-bold h-12 rounded-md shadow-md flex items-center justify-center gap-2 text-sm mt-4 transition"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'Processing Order...' : 'Confirm & Place Order'}</span>
              </Button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span>Secure 256-bit encrypted checkout</span>
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
