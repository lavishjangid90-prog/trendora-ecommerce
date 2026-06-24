import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, User } from '../types';

interface AppState {
  cart: CartItem[];
  wishlist: Product[];
  user: User | null;
  authToken: string;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, qty: number) => void;
  toggleWishlist: (product: Product) => void;
  setUser: (user: User | null) => void;
  setAuthToken: (token: string) => void;
  setAuthSession: (user: User | null, token: string) => void;
  clearAuthSession: () => void;
  clearCart: () => void;
  cartTotalHours: () => number; // sum of qty
  cartTotalPrice: () => number;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      user: null,
      authToken: '',
      
      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find(
            (c) => 
              c.product._id === item.product._id && 
              c.selectedSize === item.selectedSize &&
              c.selectedColor === item.selectedColor
          );
          
          if (existingItem) {
            return {
              cart: state.cart.map((c) => 
                c === existingItem 
                  ? { ...c, quantity: c.quantity + item.quantity }
                  : c
              )
            };
          }
          
          return { cart: [...state.cart, item] };
        });
      },
      
      removeFromCart: (productId, size, color) => {
        set((state) => ({
          cart: state.cart.filter(
            (c) => !(c.product._id === productId && c.selectedSize === size && c.selectedColor === color)
          )
        }));
      },
      
      updateQuantity: (productId, size, color, qty) => {
        if (qty < 1) return;
        set((state) => ({
          cart: state.cart.map((c) => 
            (c.product._id === productId && c.selectedSize === size && c.selectedColor === color)
              ? { ...c, quantity: qty }
              : c
          )
        }));
      },
      
      toggleWishlist: (product) => {
        set((state) => {
          const exists = state.wishlist.find((w) => w._id === product._id);
          if (exists) {
            return { wishlist: state.wishlist.filter((w) => w._id !== product._id) };
          }
          return { wishlist: [...state.wishlist, product] };
        });
      },
      
      setUser: (user) => set({ user }),

      setAuthToken: (token) => set({ authToken: token }),

      setAuthSession: (user, token) => set({ user, authToken: token }),

      clearAuthSession: () => set({ user: null, authToken: '' }),
      
      clearCart: () => set({ cart: [] }),
      
      cartTotalHours: () => {
        return get().cart.reduce((total, item) => total + item.quantity, 0);
      },
      
      cartTotalPrice: () => {
        return get().cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      }
    }),
    {
      name: 'trendora-storage',
      partialize: (state) => ({
        cart: state.cart,
        wishlist: state.wishlist,
        user: state.user,
        authToken: state.authToken,
      }),
    }
  )
);
