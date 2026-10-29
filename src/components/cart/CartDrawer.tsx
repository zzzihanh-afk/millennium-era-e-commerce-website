import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    getSubtotal,
    getItemCount,
  } = useCartStore();

  const subtotal = getSubtotal();
  const itemCount = getItemCount();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    closeCart();
    navigate('/cart');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 bg-white">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-gray-100 flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-red" />
            <SheetTitle className="text-lg font-bold text-gray-900">
              Your Cart ({itemCount})
            </SheetTitle>
          </div>
        </SheetHeader>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-brand-red" />
              </div>
              <p className="text-base font-semibold text-gray-800">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Looks like you haven't added anything to your cart yet.
              </p>
              <Button
                onClick={() => {
                  closeCart();
                  navigate('/shop');
                }}
                className="mt-6 bg-brand-red hover:bg-brand-red-dark text-white rounded-md px-6"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId || 'base'}`}
                className="py-4 flex gap-3 items-start first:pt-0 last:pb-0"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-md bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {item.productName}
                  </h4>
                  {item.variantName && (
                    <p className="text-xs text-gray-500 mt-0.5">{item.variantName}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-brand-red">
                      {formatPrice(item.unitPrice)}
                    </span>
                    {item.regularPrice > item.unitPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatPrice(item.regularPrice)}
                      </span>
                    )}
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity - 1)
                        }
                        className="p-1 hover:bg-gray-100 text-gray-600 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-semibold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.variantId, item.quantity + 1)
                        }
                        className="p-1 hover:bg-gray-100 text-gray-600 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-gray-400 hover:text-red-600 p-1 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with subtotal and buttons */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Subtotal</span>
              <span className="text-base font-bold text-gray-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Shipping and taxes calculated at checkout.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleViewCart}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                View Cart
              </Button>
              <Button
                onClick={handleCheckout}
                className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-semibold flex items-center justify-center gap-1.5 shadow-sm"
              >
                Checkout <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
