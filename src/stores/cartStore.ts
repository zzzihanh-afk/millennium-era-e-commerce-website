import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocalCartItem, ShippingZone, Coupon } from '@/types';

interface CartState {
  items: LocalCartItem[];
  isOpen: boolean;
  selectedShippingZone: ShippingZone | null;
  appliedCoupon: Coupon | null;
  
  // Actions
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  addItem: (item: Omit<LocalCartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  clearCart: () => void;
  
  setShippingZone: (zone: ShippingZone | null) => void;
  setCoupon: (coupon: Coupon | null) => void;
  
  // Computed values
  getSubtotal: () => number;
  getItemCount: () => number;
  getDiscountAmount: () => number;
  getShippingFee: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      selectedShippingZone: null,
      appliedCoupon: null,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (itemData, quantity = 1) => {
        const { items } = get();
        const existingIndex = items.findIndex(
          (i) => i.productId === itemData.productId && i.variantId === itemData.variantId
        );

        if (existingIndex > -1) {
          const currentItem = items[existingIndex]!;
          const newQty = Math.min(currentItem.quantity + quantity, currentItem.maxQuantity || 99);
          const updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...currentItem,
            quantity: newQty,
          };
          set({ items: updatedItems, isOpen: true });
        } else {
          set({
            items: [
              ...items,
              {
                ...itemData,
                quantity: Math.min(quantity, itemData.maxQuantity || 99),
              },
            ],
            isOpen: true,
          });
        }
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((i) => {
            if (i.productId === productId && i.variantId === variantId) {
              return {
                ...i,
                quantity: Math.min(quantity, i.maxQuantity || 99),
              };
            }
            return i;
          }),
        }));
      },

      clearCart: () => set({ items: [], appliedCoupon: null }),

      setShippingZone: (zone) => set({ selectedShippingZone: zone }),
      setCoupon: (coupon) => set({ appliedCoupon: coupon }),

      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;

        if (coupon.minimum_order_amount && subtotal < coupon.minimum_order_amount) {
          return 0;
        }

        if (coupon.coupon_type === 'percentage') {
          // value is percentage * 100
          let discount = Math.round((subtotal * coupon.value) / 10000);
          if (coupon.maximum_discount_amount && discount > coupon.maximum_discount_amount) {
            discount = coupon.maximum_discount_amount;
          }
          return discount;
        }

        if (coupon.coupon_type === 'fixed_amount') {
          return Math.min(coupon.value, subtotal);
        }

        return 0;
      },

      getShippingFee: () => {
        const zone = get().selectedShippingZone;
        if (!zone) return 0;

        const subtotalAfterDiscount = get().getSubtotal() - get().getDiscountAmount();
        
        // Free shipping coupon check
        if (get().appliedCoupon?.coupon_type === 'free_shipping') {
          return 0;
        }

        // Zone threshold check
        if (zone.free_shipping_threshold && subtotalAfterDiscount >= zone.free_shipping_threshold) {
          return 0;
        }

        return zone.shipping_fee;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscountAmount();
        const shipping = get().getShippingFee();
        return Math.max(0, subtotal - discount + shipping);
      },
    }),
    {
      name: 'millennium-era-cart',
      partialize: (state) => ({
        items: state.items,
        selectedShippingZone: state.selectedShippingZone,
      }),
    }
  )
);
