import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  compare_at_price?: number | null;
  images: string[];
  category: string | null;
  quantity: number;
}

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlists' as any)
        .select(`
          id,
          product_id,
          products (
            id,
            name,
            price,
            compare_at_price,
            images,
            category,
            quantity
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const wishlistItems: WishlistItem[] = ((data as any[]) || [])
        .filter((item: any) => item.products)
        .map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          name: item.products.name,
          price: item.products.price,
          compare_at_price: item.products.compare_at_price,
          images: item.products.images || [],
          category: item.products.category,
          quantity: item.products.quantity,
        }));

      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (productId: string) => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlists' as any)
        .insert({ user_id: user.id, product_id: productId });

      if (error) {
        if (error.code === '23505') {
          toast.info('Already in wishlist');
          return;
        }
        throw error;
      }

      await fetchWishlist();
      toast.success('Added to wishlist');
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlists' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(current => current.filter(item => item.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const itemCount = items.length;

  return (
    <WishlistContext.Provider value={{
      items,
      loading,
      addItem,
      removeItem,
      isInWishlist,
      itemCount,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
