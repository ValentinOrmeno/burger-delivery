import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/lib/supabase';

export type Extra = {
  addon: {
    id: string;
    name: string;
    price: number;
    category: string;
  };
  quantity: number;
};

export type CartItem = {
  id: string; // ID único para el item (producto + extras)
  product: Product;
  quantity: number;
  extras: Extra[];
  totalPrice: number; // Precio con extras incluidos
};

export type PromoContext = {
  paymentMethod?: 'cash' | 'mercadopago';
  orderType?: 'delivery' | 'pickup';
};

type CartStore = {
  items: CartItem[];
  addItem: (product: Product, quantity: number, extras: Extra[]) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: (context?: PromoContext) => number;
  getItemCount: () => number;
  getEffectiveUnitPrice: (product: Product, extras: Extra[], context?: PromoContext) => number;
};

// Generar ID único para un item basado en producto y extras
const generateItemId = (product: Product, extras: Extra[]): string => {
  const extrasKey = extras
    .map((e) => `${e.addon.id}:${e.quantity}`)
    .sort()
    .join(',');
  return `${product.id}-${extrasKey}`;
};

// Aplica restricciones de promo: solo efectivo, solo retiro
function shouldApplyPromo(product: Product, context?: PromoContext): boolean {
  if (!product.promo_active || product.promo_price == null) return false;
  if (!context) return true;
  if (product.promo_only_cash && context.paymentMethod !== 'cash') return false;
  if (product.promo_only_pickup && context.orderType !== 'pickup') return false;
  return true;
}

// Calcular precio unitario (base + extras) con o sin contexto de pago/retiro
export function getEffectiveUnitPrice(
  product: Product,
  extras: Extra[],
  context?: PromoContext
): number {
  const basePrice = shouldApplyPromo(product, context)
    ? (product.promo_price ?? product.price)
    : product.price;
  let total = basePrice;
  extras.forEach((extra) => {
    total += extra.addon.price * extra.quantity;
  });
  return total;
}

// Calcular precio total de un item (sin contexto: se usa al agregar al carrito)
const calculateItemPrice = (product: Product, extras: Extra[]): number => {
  return getEffectiveUnitPrice(product, extras);
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity, extras) => {
        const itemId = generateItemId(product, extras);
        const items = get().items;
        const existingItem = items.find((item) => item.id === itemId);
        
        if (existingItem) {
          // Si ya existe el mismo item con los mismos extras, aumentar cantidad
          set({
            items: items.map((item) =>
              item.id === itemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          // Agregar nuevo item
          const totalPrice = calculateItemPrice(product, extras);
          set({ 
            items: [
              ...items, 
              { 
                id: itemId,
                product, 
                quantity,
                extras,
                totalPrice,
              }
            ] 
          });
        }
      },
      
      removeItem: (itemId) => {
        set({ items: get().items.filter((item) => item.id !== itemId) });
      },
      
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        
        set({
          items: get().items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: (context) => {
        const items = get().items;
        if (context) {
          return items.reduce(
            (total, item) =>
              total +
              getEffectiveUnitPrice(item.product, item.extras, context) * item.quantity,
            0
          );
        }
        return items.reduce(
          (total, item) => total + item.totalPrice * item.quantity,
          0
        );
      },

      getEffectiveUnitPrice,

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      version: 2,
      skipHydration: false,
      migrate: (persistedState: unknown, version: number) => {
        // Migrar items antiguos sin extras al nuevo formato
        if (version < 2 && persistedState && typeof persistedState === 'object') {
          const oldState = persistedState as { items?: CartItem[] };
          if (oldState.items && Array.isArray(oldState.items)) {
            oldState.items = oldState.items.map((item) => {
              // Si el item no tiene id o extras, es del formato antiguo
              if (!('id' in item) || !('extras' in item)) {
                const product = (item as { product: Product }).product;
                const quantity = (item as { quantity?: number }).quantity || 1;
                const extras: Extra[] = [];
                const itemId = generateItemId(product, extras);
                const totalPrice = calculateItemPrice(product, extras);
                
                return {
                  id: itemId,
                  product: product,
                  quantity: quantity,
                  extras: extras,
                  totalPrice: totalPrice,
                };
              }
              return item;
            });
          }
        }
        return persistedState;
      },
    }
  )
);
