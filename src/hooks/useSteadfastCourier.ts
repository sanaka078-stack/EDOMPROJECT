import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SteadfastOrder {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
  item_description?: string;
}

export interface SteadfastConsignment {
  consignment_id: number;
  invoice: string;
  tracking_code: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  status: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface SteadfastBalance {
  status: number;
  current_balance: number;
}

export interface SteadfastDeliveryStatus {
  status: number;
  delivery_status: string;
}

export function useSteadfastCourier() {
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const callSteadfast = async (action: string, payload: Record<string, any> = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('steadfast-courier', {
        body: { action, ...payload },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Steadfast API error:', error);
      toast.error(`Steadfast API error: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async (): Promise<SteadfastBalance> => {
    const result = await callSteadfast('get_balance');
    if (result.current_balance !== undefined) {
      setBalance(result.current_balance);
    }
    return result;
  };

  const createOrder = async (order: SteadfastOrder): Promise<{ consignment: SteadfastConsignment }> => {
    const result = await callSteadfast('create_order', { order });
    if (result.status === 200) {
      toast.success('অর্ডার সফলভাবে তৈরি হয়েছে');
    }
    return result;
  };

  const bulkCreateOrders = async (orders: SteadfastOrder[]) => {
    const result = await callSteadfast('bulk_create_orders', { orders });
    toast.success(`${orders.length} টি অর্ডার তৈরি হয়েছে`);
    return result;
  };

  const checkStatusByConsignment = async (consignment_id: number): Promise<SteadfastDeliveryStatus> => {
    return await callSteadfast('check_status_by_consignment', { consignment_id });
  };

  const checkStatusByInvoice = async (invoice: string): Promise<SteadfastDeliveryStatus> => {
    return await callSteadfast('check_status_by_invoice', { invoice });
  };

  const checkStatusByTracking = async (tracking_code: string): Promise<SteadfastDeliveryStatus> => {
    return await callSteadfast('check_status_by_tracking', { tracking_code });
  };

  const createReturnRequest = async (params: {
    consignment_id?: number;
    invoice?: string;
    tracking_code?: string;
    reason?: string;
  }) => {
    const result = await callSteadfast('create_return_request', params);
    toast.success('রিটার্ন রিকোয়েস্ট তৈরি হয়েছে');
    return result;
  };

  const getReturnRequests = async () => {
    return await callSteadfast('get_return_requests');
  };

  const getPayments = async () => {
    return await callSteadfast('get_payments');
  };

  const getPoliceStations = async () => {
    return await callSteadfast('get_police_stations');
  };

  return {
    loading,
    balance,
    getBalance,
    createOrder,
    bulkCreateOrders,
    checkStatusByConsignment,
    checkStatusByInvoice,
    checkStatusByTracking,
    createReturnRequest,
    getReturnRequests,
    getPayments,
    getPoliceStations,
  };
}
