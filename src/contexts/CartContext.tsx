import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAbandonedCartTracking } from '@/hooks/useAbandonedCartTracking';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  markCartRecovered: (orderId?: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ekta-clothing-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  // Abandoned cart tracking
  const { markAsRecovered, clearCartSession } = useAbandonedCartTracking({
    items,
    subtotal,
    enabled: true,
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse cart from localStorage');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const getItemKey = (id: string, size?: string, color?: string) => 
    `${id}-${size || 'default'}-${color || 'default'}`;

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(current => {
      const existingIndex = current.findIndex(
        item => item.id === newItem.id && item.size === newItem.size && item.color === newItem.color
      );

      if (existingIndex >= 0) {
        const updated = [...current];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      }

      return [...current, { ...newItem, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string, size?: string, color?: string) => {
    setItems(current => 
      current.filter(item => 
        !(item.id === id && item.size === size && item.color === color)
      )
    );
  };

  const updateQuantity = (id: string, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeItem(id, size, color);
      return;
    }

    setItems(current =>
      current.map(item =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    clearCartSession();
  };

  const markCartRecovered = async (orderId?: string) => {
    await markAsRecovered(orderId);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotal,
      isOpen,
      setIsOpen,
      markCartRecovered
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
