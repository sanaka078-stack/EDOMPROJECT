import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AbandonedCart {
  id: string;
  session_id: string;
  user_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  cart_items: any[];
  cart_total: number;
  abandoned_at: string | null;
  reminder_sent_count: number;
  first_reminder_sent_at: string | null;
  second_reminder_sent_at: string | null;
  final_reminder_sent_at: string | null;
  recovered_at: string | null;
  recovered_order_id: string | null;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface AbandonedCartStats {
  totalAbandoned: number;
  recovered: number;
  pending: number;
  recoveryRate: number;
  totalLostRevenue: number;
  totalRecoveredRevenue: number;
  avgCartValue: number;
  remindersSent: number;
}

export function useAbandonedCartsData() {
  const {
    data: abandonedCarts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("abandoned_carts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((cart) => ({
        ...cart,
        cart_items: Array.isArray(cart.cart_items) ? cart.cart_items : [],
      })) as AbandonedCart[];
    },
  });

  const stats: AbandonedCartStats = {
    totalAbandoned: abandonedCarts.filter((c) => c.abandoned_at).length,
    recovered: abandonedCarts.filter((c) => c.recovered_at).length,
    pending: abandonedCarts.filter((c) => c.abandoned_at && !c.recovered_at).length,
    recoveryRate:
      abandonedCarts.filter((c) => c.abandoned_at).length > 0
        ? Math.round(
            (abandonedCarts.filter((c) => c.recovered_at).length /
              abandonedCarts.filter((c) => c.abandoned_at).length) *
              100
          )
        : 0,
    totalLostRevenue: abandonedCarts
      .filter((c) => c.abandoned_at && !c.recovered_at)
      .reduce((sum, c) => sum + (c.cart_total || 0), 0),
    totalRecoveredRevenue: abandonedCarts
      .filter((c) => c.recovered_at)
      .reduce((sum, c) => sum + (c.cart_total || 0), 0),
    avgCartValue:
      abandonedCarts.length > 0
        ? Math.round(
            abandonedCarts.reduce((sum, c) => sum + (c.cart_total || 0), 0) /
              abandonedCarts.length
          )
        : 0,
    remindersSent: abandonedCarts.reduce(
      (sum, c) => sum + (c.reminder_sent_count || 0),
      0
    ),
  };

  return {
    abandonedCarts,
    stats,
    isLoading,
    error,
    refetch,
  };
}
