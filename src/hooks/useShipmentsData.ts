import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Extended Shipment interface with order details
export interface Shipment {
  id: string;
  order_id: string;
  courier: string;
  consignment_id: string | null;
  tracking_number: string | null;
  status: string;
  courier_response: any;
  created_at: string;
  updated_at: string;
  // Extended fields from order join
  order_number?: string;
  recipient_name?: string;
  recipient_phone?: string;
  cod_amount?: number;
  delivery_charge?: number | null;
  sent_at?: string;
}

export function useShipmentsData() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch shipments with order details
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          orders!shipments_order_id_fkey (
            order_number,
            shipping_address,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to include order details
      const mappedShipments = (data || []).map((item: any): Shipment => {
        const order = item.orders;
        const shippingAddress = order?.shipping_address;
        
        return {
          id: item.id,
          order_id: item.order_id,
          courier: item.courier,
          consignment_id: item.consignment_id,
          tracking_number: item.tracking_number,
          status: item.status,
          courier_response: item.courier_response,
          created_at: item.created_at,
          updated_at: item.updated_at,
          // Extended fields
          order_number: order?.order_number || '',
          recipient_name: typeof shippingAddress === 'object' ? shippingAddress?.name || '' : '',
          recipient_phone: typeof shippingAddress === 'object' ? shippingAddress?.phone || '' : '',
          cod_amount: order?.total_amount || 0,
          delivery_charge: item.courier_response?.delivery_charge || null,
          sent_at: item.created_at,
        };
      });
      
      setShipments(mappedShipments);
    } catch (error) {
      console.error('Error fetching shipments:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const addShipment = async (shipment: {
    order_id: string;
    courier: string;
    consignment_id?: string | null;
    tracking_number?: string | null;
    status?: string;
    courier_response?: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .insert({
          order_id: shipment.order_id,
          courier: shipment.courier,
          consignment_id: shipment.consignment_id || null,
          tracking_number: shipment.tracking_number || null,
          status: shipment.status || 'pending',
          courier_response: shipment.courier_response || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Refetch to get the full data with order details
      await fetchShipments();
      return data as Shipment;
    } catch (error) {
      console.error('Error adding shipment:', error);
      throw error;
    }
  };

  const updateShipment = async (id: string, updates: Partial<Shipment>) => {
    try {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.tracking_number !== undefined) dbUpdates.tracking_number = updates.tracking_number;
      if (updates.consignment_id !== undefined) dbUpdates.consignment_id = updates.consignment_id;
      if (updates.courier_response !== undefined) dbUpdates.courier_response = updates.courier_response;
      
      const { error } = await supabase
        .from('shipments')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      setShipments(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (error) {
      console.error('Error updating shipment:', error);
      throw error;
    }
  };

  const updateShipmentStatus = async (id: string, status: string, courierStatus?: string) => {
    const updates: any = { status };
    if (courierStatus) {
      const shipment = shipments.find(s => s.id === id);
      updates.courier_response = {
        ...(shipment?.courier_response || {}),
        courier_status: courierStatus
      };
    }
    await updateShipment(id, updates);
  };

  const getShipmentsByCourier = (courier: string) => {
    return shipments.filter(s => s.courier === courier);
  };

  const getShipmentByTrackingNumber = (trackingNumber: string) => {
    return shipments.find(s => s.tracking_number === trackingNumber);
  };

  const getShipmentByOrderId = (orderId: string) => {
    return shipments.find(s => s.order_id === orderId);
  };

  const stats = {
    total: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    inTransit: shipments.filter(s => ['picked_up', 'in_transit', 'out_for_delivery'].includes(s.status)).length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    returned: shipments.filter(s => s.status === 'returned').length,
  };

  return {
    shipments,
    loading,
    stats,
    refetch: fetchShipments,
    addShipment,
    updateShipment,
    updateShipmentStatus,
    getShipmentsByCourier,
    getShipmentByTrackingNumber,
    getShipmentByOrderId,
  };
}
