import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice, calcDiscountPercent } from '@/lib/utils';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (productId: string) => void;
  isInWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onWishlistToggle,
  isInWishlist = false,
}) => {
  const { addItem } = useCartStore();

  const primaryImage =
    product.images?.find((img) => img.is_primary)?.url ||
    product.images?.[0]?.url ||
    '/assets/logo.png';

  const hasDiscount =
    product.sale_price !== null &&
    product.sale_price !== undefined &&
    product.sale_price < product.regular_price;

  const discountPercent = hasDiscount
    ? calcDiscountPercent(product.regular_price, product.sale_price!)
    : 0;

  const isNew =
    product.created_at &&
    new Date().getTime() - new Date(product.created_at).getTime() < 14 * 86400000;

  const effectivePrice = hasDiscount ? product.sale_price! : product.regular_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem(
      {
        productId: product.id,
        variantId: null,
        productName: product.name,
        variantName: null,
        unitPrice: effectivePrice,
        regularPrice: product.regular_price,
        imageUrl: primaryImage,
        maxQuantity: product.stock_quantity || 10,
      },
      1
    );

    toast.success(`Added ${product.name} to cart`);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(product.id);
    } else {
      toast.info('Wishlist updated');
    }
  };

  return (
    <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      {/* Top Image Container */}
      <Link to={`/product/${product.slug}`} className="block relative bg-gray-50 pt-[100%] overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/logo.png';
          }}
          className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Badges on Top-Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {hasDiscount && (
            <span className="bg-brand-red text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
              -{discountPercent}%
            </span>
          )}
          {isNew && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button on Top-Right */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm transition hover:scale-110 z-10 ${
            isInWishlist ? 'text-brand-red fill-brand-red' : 'text-gray-400 hover:text-brand-red'
          }`}
          aria-label="Add to wishlist"
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
        </button>
      </Link>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category */}
          {product.category && (
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1 truncate">
              {product.category.name}
            </p>
          )}

          {/* Product Name */}
          <Link to={`/product/${product.slug}`}>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-brand-red transition line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Rating */}
          {product.review_count > 0 ? (
            <div className="flex items-center gap-1 mt-1.5">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < Math.round(product.average_rating || 0)
                        ? 'fill-current'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-gray-400">({product.review_count})</span>
            </div>
          ) : (
            <div className="h-4 mt-1.5" />
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-brand-red">
              {formatPrice(effectivePrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.regular_price)}
              </span>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white text-xs font-semibold h-9 rounded flex items-center justify-center gap-1.5 transition"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
