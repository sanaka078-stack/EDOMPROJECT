import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CartItem } from '@/contexts/CartContext';

const SESSION_KEY = 'ekta-cart-session-id';
const ABANDONMENT_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes of inactivity

// Generate a unique session ID
const generateSessionId = () => {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get or create session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

interface UseAbandonedCartTrackingOptions {
  items: CartItem[];
  subtotal: number;
  customerEmail?: string;
  customerName?: string;
  enabled?: boolean;
}

export function useAbandonedCartTracking({
  items,
  subtotal,
  customerEmail,
  customerName,
  enabled = true,
}: UseAbandonedCartTrackingOptions) {
  const lastActivityRef = useRef<number>(Date.now());
  const abandonmentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useRef<string>(getSessionId());

  // Sync cart to database (debounced)
  const syncCartToDatabase = useCallback(async () => {
    if (!enabled || items.length === 0) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const cartData = {
        session_id: sessionId.current,
        user_id: user?.id || null,
        customer_email: customerEmail || user?.email || null,
        customer_name: customerName || user?.user_metadata?.full_name || null,
        cart_items: items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
          color: item.color,
        })),
        cart_total: subtotal,
        last_activity_at: new Date().toISOString(),
        abandoned_at: null, // Reset abandoned status on activity
      };

      const { error } = await supabase
        .from('abandoned_carts')
        .upsert(cartData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error syncing cart:', error);
      } else {
        console.log('Cart synced to database');
      }
    } catch (error) {
      console.error('Error syncing abandoned cart:', error);
    }
  }, [items, subtotal, customerEmail, customerName, enabled]);

  // Mark cart as abandoned
  const markAsAbandoned = useCallback(async () => {
    if (!enabled || items.length === 0) return;

    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ 
          abandoned_at: new Date().toISOString() 
        })
        .eq('session_id', sessionId.current)
        .is('recovered_at', null);

      if (error) {
        console.error('Error marking cart as abandoned:', error);
      } else {
        console.log('Cart marked as abandoned');
      }
    } catch (error) {
      console.error('Error marking cart abandoned:', error);
    }
  }, [items, enabled]);

  // Reset abandonment timer on user activity
  const resetAbandonmentTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (abandonmentTimeoutRef.current) {
      clearTimeout(abandonmentTimeoutRef.current);
    }
    
    if (enabled && items.length > 0) {
      abandonmentTimeoutRef.current = setTimeout(() => {
        markAsAbandoned();
      }, ABANDONMENT_THRESHOLD_MS);
    }
  }, [enabled, items.length, markAsAbandoned]);

  // Sync cart when items change (debounced)
  useEffect(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    if (items.length > 0) {
      syncTimeoutRef.current = setTimeout(() => {
        syncCartToDatabase();
        resetAbandonmentTimer();
      }, 2000); // Debounce 2 seconds
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, syncCartToDatabase, resetAbandonmentTimer]);

  // Track user activity
  useEffect(() => {
    if (!enabled) return;

    const handleActivity = () => {
      resetAbandonmentTimer();
    };

    // Listen for user activity
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('click', handleActivity);

    // Initial timer
    resetAbandonmentTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('click', handleActivity);
      
      if (abandonmentTimeoutRef.current) {
        clearTimeout(abandonmentTimeoutRef.current);
      }
    };
  }, [enabled, resetAbandonmentTimer]);

  // Mark as recovered when checkout completes
  const markAsRecovered = useCallback(async (orderId?: string) => {
    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ 
          recovered_at: new Date().toISOString(),
          recovered_order_id: orderId || null,
        })
        .eq('session_id', sessionId.current);

      if (error) {
        console.error('Error marking cart as recovered:', error);
      } else {
        // Generate new session for next cart
        sessionId.current = generateSessionId();
        localStorage.setItem(SESSION_KEY, sessionId.current);
        console.log('Cart marked as recovered');
      }
    } catch (error) {
      console.error('Error marking cart recovered:', error);
    }
  }, []);

  // Clear cart session
  const clearCartSession = useCallback(async () => {
    try {
      await supabase
        .from('abandoned_carts')
        .delete()
        .eq('session_id', sessionId.current);
      
      // Generate new session
      sessionId.current = generateSessionId();
      localStorage.setItem(SESSION_KEY, sessionId.current);
    } catch (error) {
      console.error('Error clearing cart session:', error);
    }
  }, []);

  return {
    markAsRecovered,
    clearCartSession,
    sessionId: sessionId.current,
  };
}
