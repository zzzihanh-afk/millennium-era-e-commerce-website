import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getWishlist, removeFromWishlist } from '@/services/wishlist';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice } from '@/lib/utils';
import type { WishlistItem } from '@/types';
import { toast } from 'sonner';

export const WishlistPage: React.FC = () => {
  const { user } = useAuth();
  const { addItem } = useCartStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getWishlist()
        .then(setItems)
        .catch((err) => console.warn('Could not load wishlist:', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove');
    }
  };

  const handleMoveToCart = (item: WishlistItem) => {
    if (!item.product) return;
    const effectivePrice =
      item.product.sale_price !== null && item.product.sale_price < item.product.regular_price
        ? item.product.sale_price
        : item.product.regular_price;

    addItem(
      {
        productId: item.product.id,
        variantId: null,
        productName: item.product.name,
        variantName: null,
        unitPrice: effectivePrice,
        regularPrice: item.product.regular_price,
        imageUrl: item.product.images?.[0]?.url || '/assets/logo.png',
        maxQuantity: item.product.stock_quantity || 10,
      },
      1
    );

    toast.success(`Moved ${item.product.name} to cart`);
  };

  return (
    <div className="bg-gray-50/70 min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-8">
          My Saved Wishlist
        </h1>

        {!user ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center max-w-md mx-auto">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Sign in to save your favorite items
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Save luxury pieces and receive alerts on stock availability.
            </p>
            <Link to="/login">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6">
                Sign In
              </Button>
            </Link>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 h-64" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">Your wishlist is currently empty</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto mb-6">
              Tap the heart icon on any product to save it for later.
            </p>
            <Link to="/shop">
              <Button className="bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold px-6">
                Browse Collection
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => {
              if (!item.product) return null;
              const prod = item.product;
              const price =
                prod.sale_price !== null && prod.sale_price < prod.regular_price
                  ? prod.sale_price
                  : prod.regular_price;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-between"
                >
                  <Link to={`/product/${prod.slug}`} className="block aspect-square bg-gray-50 rounded-lg p-4 mb-3">
                    <img
                      src={prod.images?.[0]?.url || '/assets/logo.png'}
                      alt={prod.name}
                      className="w-full h-full object-contain"
                    />
                  </Link>

                  <div className="space-y-2">
                    <Link to={`/product/${prod.slug}`}>
                      <h4 className="text-sm font-bold text-gray-900 hover:text-brand-red transition line-clamp-1">
                        {prod.name}
                      </h4>
                    </Link>
                    <p className="text-sm font-bold text-brand-red">{formatPrice(price)}</p>

                    <div className="pt-2 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-semibold h-8"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                        Add to Cart
                      </Button>
                      <button
                        onClick={() => handleRemove(prod.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded border border-gray-200 transition"
                        aria-label="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
