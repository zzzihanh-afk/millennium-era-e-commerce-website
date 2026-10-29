import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Star,
  Check,
  ChevronRight,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/store/ProductCard';
import { useCartStore } from '@/stores/cartStore';
import { formatPrice, calcDiscountPercent, getStockInfo } from '@/lib/utils';
import { getProductBySlug, getRelatedProducts } from '@/services/products';
import type { Product, ProductVariant } from '@/types';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCartStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Variation selections
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  // Load product & related
  useEffect(() => {
    async function fetchDetail() {
      if (!slug) return;
      setLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        if (!prod) {
          navigate('/shop');
          return;
        }
        setProduct(prod);

        // Set primary image
        const mainImg =
          prod.images?.find((img) => img.is_primary)?.url ||
          prod.images?.[0]?.url ||
          '/assets/logo.png';
        setSelectedImage(mainImg);

        // If product has variants, select the first active variant
        if (prod.has_variants && prod.variants && prod.variants.length > 0) {
          const firstVariant = prod.variants.find((v) => v.is_active && v.stock_quantity > 0) || prod.variants[0];
          setSelectedVariant(firstVariant || null);
          if (firstVariant?.image_url) {
            setSelectedImage(firstVariant.image_url);
          }
        } else {
          setSelectedVariant(null);
        }

        // Fetch related products
        if (prod.category_id) {
          const related = await getRelatedProducts(prod.id, prod.category_id, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Failed to load product detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
    window.scrollTo(0, 0);
  }, [slug, navigate]);

  // Handle variant selection
  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    if (variant.image_url) {
      setSelectedImage(variant.image_url);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-xl" />
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/4" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-6 bg-gray-100 rounded w-1/3" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  // Pricing calculations based on variant or base product
  const regularPrice = selectedVariant ? selectedVariant.regular_price : product.regular_price;
  const salePrice = selectedVariant ? selectedVariant.sale_price : product.sale_price;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const currentSku = selectedVariant ? selectedVariant.sku : product.sku;

  const hasDiscount = salePrice !== null && salePrice !== undefined && salePrice < regularPrice;
  const effectivePrice = hasDiscount ? salePrice! : regularPrice;
  const discountPercent = hasDiscount ? calcDiscountPercent(regularPrice, salePrice!) : 0;
  const stockInfo = getStockInfo(currentStock, 5);

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      toast.error('This item is currently out of stock');
      return;
    }

    addItem(
      {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        productName: product.name,
        variantName: selectedVariant?.name || null,
        unitPrice: effectivePrice,
        regularPrice: regularPrice,
        imageUrl: selectedImage,
        maxQuantity: currentStock,
      },
      quantity
    );

    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/checkout');
  };

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-brand-red">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link to="/shop" className="hover:text-brand-red">
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <Link to={`/category/${product.category.slug}`} className="hover:text-brand-red">
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Left Column: Image Gallery (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Main Image */}
            <div className="relative aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center p-6 shadow-sm">
              <img
                src={selectedImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              />
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded shadow">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Thumbnails Row */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`w-18 h-18 rounded-lg border-2 p-1 bg-gray-50 flex-shrink-0 transition overflow-hidden ${
                      selectedImage === img.url
                        ? 'border-brand-red shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img.url} alt="Thumbnail" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Buying Options & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Category */}
            <div>
              {product.category && (
                <span className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 tracking-tight">
                {product.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {currentSku && (
                  <span>
                    SKU: <strong className="text-gray-700">{currentSku}</strong>
                  </span>
                )}
                <span>•</span>
                <span className={`font-semibold ${stockInfo.color}`}>
                  ● {stockInfo.label}
                </span>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-red-50/50 border border-red-100 rounded-lg flex items-baseline gap-3">
              <span className="text-3xl font-black text-brand-red">
                {formatPrice(effectivePrice)}
              </span>
              {hasDiscount && (
                <span className="text-base text-gray-400 line-through">
                  {formatPrice(regularPrice)}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-brand-red bg-red-100 px-2 py-0.5 rounded">
                  Save {formatPrice(regularPrice - salePrice!)}
                </span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-sm text-gray-600 leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Product Variations Selector */}
            {product.has_variants && product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-800">
                  Select Variation: <span className="text-brand-red font-semibold">{selectedVariant?.name || 'Default'}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant) => {
                    const isSelected = selectedVariant?.id === variant.id;
                    const isOutOfStock = variant.stock_quantity <= 0;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => handleSelectVariant(variant)}
                        disabled={isOutOfStock}
                        className={`px-4 py-2 text-xs font-semibold rounded-md border transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-brand-red bg-brand-red text-white shadow-sm'
                            : isOutOfStock
                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                            : 'border-gray-300 bg-white text-gray-800 hover:border-brand-red'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{variant.name || variant.sku}</span>
                        <span className="opacity-80 text-[10px]">
                          ({formatPrice(variant.sale_price || variant.regular_price)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Controls & Action Buttons */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-300 rounded-md bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || currentStock <= 0}
                    className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-40 transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                    disabled={quantity >= currentStock || currentStock <= 0}
                    className="p-2 hover:bg-gray-100 text-gray-600 disabled:opacity-40 transition"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Buy Now Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={currentStock <= 0}
                  className="bg-brand-red hover:bg-brand-red-dark text-white font-bold h-12 rounded-md shadow-md flex items-center justify-center gap-2 text-sm transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{currentStock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={currentStock <= 0}
                  variant="outline"
                  className="border-2 border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white font-bold h-12 rounded-md text-sm transition"
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Assurances & Shipping Box */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs text-gray-600">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-brand-red" />
                <span className="font-semibold text-gray-800">Fast Delivery</span>
                <span className="text-[10px] text-gray-400">Dhaka & Nationwide</span>
              </div>
              <div className="flex flex-col items-center gap-1 border-x border-gray-200 px-2">
                <RotateCcw className="w-5 h-5 text-brand-red" />
                <span className="font-semibold text-gray-800">7-Day Returns</span>
                <span className="text-[10px] text-gray-400">Hassle-free guarantee</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-brand-red" />
                <span className="font-semibold text-gray-800">100% Genuine</span>
                <span className="text-[10px] text-gray-400">Authentic Millennium Era</span>
              </div>
            </div>
          </div>
        </div>

        {/* Specifications & Full Description Tabs */}
        <div className="mb-16 bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-3 mb-4">
            Product Description & Specifications
          </h2>
          <div className="prose max-w-none text-sm text-gray-600 leading-relaxed mb-8">
            <p>{product.description || product.short_description || 'Detailed description coming soon.'}</p>
          </div>

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-3">
                Technical Specifications
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr
                        key={key}
                        className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                      >
                        <td className="p-3 font-semibold text-gray-700 w-1/3 border-r border-gray-200">
                          {key}
                        </td>
                        <td className="p-3 text-gray-600">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
