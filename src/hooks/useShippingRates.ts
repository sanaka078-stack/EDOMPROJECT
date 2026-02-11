import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShippingRate {
  id: string;
  zone_id: string | null;
  name: string;
  rate: number;
  min_weight: number | null;
  max_weight: number | null;
  min_order_amount: number | null;
  max_order_amount: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShippingRates() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shipping_rates")
        .select("*")
        .order("name");

      if (error) throw error;
      setRates((data as ShippingRate[]) || []);
    } catch (error: any) {
      console.error("Error fetching shipping rates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const addRate = async (rate: Omit<ShippingRate, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("shipping_rates")
        .insert(rate as any)
        .select()
        .single();

      if (error) throw error;
      setRates((prev) => [...prev, data as ShippingRate]);
      toast.success("Shipping rate created");
      return data as ShippingRate;
    } catch (error: any) {
      toast.error(error.message || "Failed to create rate");
      throw error;
    }
  };

  const updateRate = async (id: string, updates: Partial<ShippingRate>) => {
    try {
      const { error } = await supabase
        .from("shipping_rates")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setRates((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      toast.success("Shipping rate updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update rate");
      throw error;
    }
  };

  const deleteRate = async (id: string) => {
    try {
      const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
      if (error) throw error;
      setRates((prev) => prev.filter((r) => r.id !== id));
      toast.success("Shipping rate deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rate");
      throw error;
    }
  };

  const getRatesByZone = (zoneId: string) => rates.filter((r) => r.zone_id === zoneId);

  return {
    rates,
    loading,
    refetch: fetchRates,
    addRate,
    updateRate,
    deleteRate,
    getRatesByZone,
  };
}
