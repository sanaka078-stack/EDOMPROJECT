import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PathaoOrder {
  store_id?: number;
  merchant_order_id?: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: number;
  recipient_zone: number;
  recipient_area?: number;
  delivery_type?: number; // 48 for Normal, 12 for On Demand
  item_type?: number; // 1 for Document, 2 for Parcel
  special_instruction?: string;
  item_quantity?: number;
  item_weight?: number;
  item_description?: string;
  amount_to_collect: number;
}

export interface PathaoStore {
  store_id: number;
  store_name: string;
  store_address: string;
  is_active: number;
  city_id: number;
  zone_id: number;
  hub_id: number;
}

export interface PathaoCity {
  city_id: number;
  city_name: string;
}

export interface PathaoZone {
  zone_id: number;
  zone_name: string;
}

export interface PathaoArea {
  area_id: number;
  area_name: string;
  home_delivery_available: boolean;
  pickup_available: boolean;
}

export function usePathaoCourier() {
  const [loading, setLoading] = useState(false);

  const callPathao = async (action: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pathao-courier', {
        body: { action, ...payload },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (error: any) {
      console.error('Pathao API error:', error);
      toast.error(`Pathao API error: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const result = await callPathao('test_connection');
    if (result?.code === 200) {
      toast.success('Pathao connection successful!');
    }
    return result;
  };

  const getStores = async (): Promise<PathaoStore[]> => {
    const result = await callPathao('get_stores');
    return result?.data?.data || [];
  };

  const getCities = async (): Promise<PathaoCity[]> => {
    const result = await callPathao('get_cities');
    return result?.data?.data || [];
  };

  const getZones = async (cityId: number): Promise<PathaoZone[]> => {
    const result = await callPathao('get_zones', { city_id: cityId });
    return result?.data?.data || [];
  };

  const getAreas = async (zoneId: number): Promise<PathaoArea[]> => {
    const result = await callPathao('get_areas', { zone_id: zoneId });
    return result?.data?.data || [];
  };

  const createOrder = async (order: PathaoOrder) => {
    const result = await callPathao('create_order', { order });
    if (result?.code === 200) {
      toast.success('Pathao অর্ডার সফলভাবে তৈরি হয়েছে');
    }
    return result;
  };

  const bulkCreateOrders = async (orders: PathaoOrder[]) => {
    const result = await callPathao('bulk_create_orders', { orders });
    if (result?.code === 202) {
      toast.success(`${orders.length} টি অর্ডার Pathao তে পাঠানো হয়েছে`);
    }
    return result;
  };

  const getOrderInfo = async (consignmentId: string) => {
    return await callPathao('get_order_info', { consignment_id: consignmentId });
  };

  const calculatePrice = async (params: {
    store_id?: number;
    item_type?: number;
    delivery_type?: number;
    item_weight?: number;
    recipient_city: number;
    recipient_zone: number;
  }) => {
    return await callPathao('calculate_price', params);
  };

  return {
    loading,
    testConnection,
    getStores,
    getCities,
    getZones,
    getAreas,
    createOrder,
    bulkCreateOrders,
    getOrderInfo,
    calculatePrice,
  };
}
