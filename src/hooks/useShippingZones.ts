import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShippingZone {
  id: string;
  name: string;
  name_bn?: string | null;
  countries?: string[];
  regions: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShippingZones() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("shipping_zones")
        .select("*")
        .order("name");

      if (error) throw error;
      const mappedZones: ShippingZone[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        name_bn: (item as any).name_bn ?? null,
        countries: item.countries,
        regions: item.regions,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setZones(mappedZones);
    } catch (error: any) {
      console.error("Error fetching shipping zones:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const addZone = async (zone: Omit<ShippingZone, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("shipping_zones")
        .insert({
          name: zone.name,
          regions: zone.regions,
          is_active: zone.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      const newZone: ShippingZone = {
        id: data.id,
        name: data.name,
        name_bn: (data as any).name_bn ?? null,
        countries: data.countries,
        regions: data.regions,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setZones((prev) => [...prev, newZone]);
      toast.success("Shipping zone created");
      return newZone;
    } catch (error: any) {
      toast.error(error.message || "Failed to create zone");
      throw error;
    }
  };

  const updateZone = async (id: string, updates: Partial<ShippingZone>) => {
    try {
      const { error } = await supabase
        .from("shipping_zones")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...updates } : z)));
      toast.success("Shipping zone updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update zone");
      throw error;
    }
  };

  const deleteZone = async (id: string) => {
    try {
      const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
      if (error) throw error;
      setZones((prev) => prev.filter((z) => z.id !== id));
      toast.success("Shipping zone deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete zone");
      throw error;
    }
  };

  return {
    zones,
    loading,
    refetch: fetchZones,
    addZone,
    updateZone,
    deleteZone,
  };
}
