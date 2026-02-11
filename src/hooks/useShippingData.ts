import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShippingZone {
  id: string;
  name: string;
  name_bn?: string | null;
  countries?: string[];
  regions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rates?: ShippingRate[];
}

export interface ShippingRate {
  id: string;
  zone_id: string | null;
  name: string;
  rate: number;
  min_weight: number | null;
  max_weight: number | null;
  min_order_amount: number | null;
  max_order_amount: number | null;
  min_days: number | null;
  max_days: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useShippingData() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchZones = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      const mappedZones = (data || []).map((item): ShippingZone => ({
        id: item.id,
        name: item.name,
        name_bn: (item as any).name_bn ?? null,
        countries: item.countries,
        regions: item.regions || [],
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setZones(mappedZones);
    } catch (error) {
      console.error('Error fetching zones:', error);
      toast.error('Failed to load shipping zones');
    }
  }, []);

  const fetchRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      const mappedRates = (data || []).map((item): ShippingRate => ({
        id: item.id,
        zone_id: item.zone_id,
        name: item.name,
        rate: item.rate || 0,
        min_weight: item.min_weight,
        max_weight: item.max_weight,
        min_order_amount: item.min_order_amount,
        max_order_amount: item.max_order_amount,
        min_days: (item as any).min_days ?? 1,
        max_days: (item as any).max_days ?? 3,
        is_active: item.is_active ?? true,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setRates(mappedRates);
    } catch (error) {
      console.error('Error fetching rates:', error);
      toast.error('Failed to load shipping rates');
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchZones(), fetchRates()]);
    setLoading(false);
  }, [fetchZones, fetchRates]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Get zones with their rates
  const zonesWithRates = zones.map(zone => ({
    ...zone,
    rates: rates.filter(r => r.zone_id === zone.id)
  }));

  // Add zone
  const addZone = async (name: string, regions: string[]) => {
    try {
      const { data, error } = await supabase
        .from('shipping_zones')
        .insert({ name, regions })
        .select()
        .single();

      if (error) throw error;
      const newZone: ShippingZone = {
        id: data.id,
        name: data.name,
        name_bn: (data as any).name_bn ?? null,
        countries: data.countries,
        regions: data.regions || [],
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setZones(prev => [...prev, newZone]);
      toast.success('Shipping zone added');
      return data;
    } catch (error) {
      console.error('Error adding zone:', error);
      toast.error('Failed to add shipping zone');
      throw error;
    }
  };

  // Update zone
  const updateZone = async (id: string, updates: Partial<ShippingZone>) => {
    try {
      const { error } = await supabase
        .from('shipping_zones')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
      toast.success('Shipping zone updated');
    } catch (error) {
      console.error('Error updating zone:', error);
      toast.error('Failed to update shipping zone');
      throw error;
    }
  };

  // Delete zone
  const deleteZone = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shipping_zones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setZones(prev => prev.filter(z => z.id !== id));
      setRates(prev => prev.filter(r => r.zone_id !== id));
      toast.success('Shipping zone deleted');
    } catch (error) {
      console.error('Error deleting zone:', error);
      toast.error('Failed to delete shipping zone');
      throw error;
    }
  };

  // Toggle zone active status
  const toggleZone = async (id: string) => {
    const zone = zones.find(z => z.id === id);
    if (zone) {
      await updateZone(id, { is_active: !zone.is_active });
    }
  };

  // Add rate
  const addRate = async (rateData: Omit<ShippingRate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('shipping_rates')
        .insert({
          zone_id: rateData.zone_id,
          name: rateData.name,
          rate: rateData.rate,
          min_weight: rateData.min_weight,
          max_weight: rateData.max_weight,
          min_order_amount: rateData.min_order_amount,
          max_order_amount: rateData.max_order_amount,
          min_days: rateData.min_days,
          max_days: rateData.max_days,
          is_active: rateData.is_active,
        } as any)
        .select()
        .single();

      if (error) throw error;
      const newRate: ShippingRate = {
        id: data.id,
        zone_id: data.zone_id,
        name: data.name,
        rate: data.rate || 0,
        min_weight: data.min_weight,
        max_weight: data.max_weight,
        min_order_amount: data.min_order_amount,
        max_order_amount: data.max_order_amount,
        min_days: (data as any).min_days ?? 1,
        max_days: (data as any).max_days ?? 3,
        is_active: data.is_active ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setRates(prev => [...prev, newRate]);
      toast.success('Shipping rate added');
      return data;
    } catch (error) {
      console.error('Error adding rate:', error);
      toast.error('Failed to add shipping rate');
      throw error;
    }
  };

  // Update rate
  const updateRate = async (id: string, updates: Partial<ShippingRate>) => {
    try {
      const { error } = await supabase
        .from('shipping_rates')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setRates(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success('Shipping rate updated');
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update shipping rate');
      throw error;
    }
  };

  // Delete rate
  const deleteRate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('shipping_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRates(prev => prev.filter(r => r.id !== id));
      toast.success('Shipping rate deleted');
    } catch (error) {
      console.error('Error deleting rate:', error);
      toast.error('Failed to delete shipping rate');
      throw error;
    }
  };

  // Toggle rate active status
  const toggleRate = async (id: string) => {
    const rate = rates.find(r => r.id === id);
    if (rate) {
      await updateRate(id, { is_active: !rate.is_active });
    }
  };

  return {
    zones,
    rates,
    zonesWithRates,
    loading,
    refetch: fetchAll,
    addZone,
    updateZone,
    deleteZone,
    toggleZone,
    addRate,
    updateRate,
    deleteRate,
    toggleRate,
  };
}
