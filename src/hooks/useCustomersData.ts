import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CustomerOrder {
  id: string;
  order_number: string;
  created_at: string;
  total: number;
  status: string;
  items_count?: number;
}

export interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: any | null;
  user_id: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
  orders?: CustomerOrder[];
  last_order_date?: string | null;
  status?: 'active' | 'inactive' | 'blocked';
}

export function useCustomersData() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Fetch orders for each customer to get last order date
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders' as any)
        .select('customer_id, created_at, order_number, total, status')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Group orders by customer
      const ordersByCustomer: Record<string, CustomerOrder[]> = {};
      ((ordersData as any[]) || []).forEach((order: any) => {
        if (order.customer_id) {
          if (!ordersByCustomer[order.customer_id]) {
            ordersByCustomer[order.customer_id] = [];
          }
          ordersByCustomer[order.customer_id].push({
            id: order.customer_id,
            order_number: order.order_number,
            created_at: order.created_at,
            total: Number(order.total),
            status: order.status,
          });
        }
      });

      // Enrich customers with orders data
      const enrichedCustomers: Customer[] = ((customersData as any[]) || []).map((customer: any) => {
        const customerOrders = ordersByCustomer[customer.id] || [];
        const lastOrder = customerOrders[0];
        
        // Determine status based on activity
        let status: 'active' | 'inactive' | 'blocked' = 'active';
        if (lastOrder) {
          const daysSinceLastOrder = Math.floor(
            (Date.now() - new Date(lastOrder.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysSinceLastOrder > 90) {
            status = 'inactive';
          }
        } else if (customer.total_orders === 0) {
          status = 'inactive';
        }

        // Parse address if it's a JSON string
        let parsedAddress = customer.address;
        if (typeof customer.address === 'string') {
          try {
            parsedAddress = JSON.parse(customer.address);
          } catch {
            parsedAddress = { street: customer.address };
          }
        }

        return {
          id: customer.id,
          full_name: customer.full_name,
          email: customer.email,
          phone: customer.phone,
          address: parsedAddress,
          user_id: customer.user_id,
          total_orders: customer.total_orders || 0,
          total_spent: customer.total_spent || 0,
          created_at: customer.created_at,
          updated_at: customer.updated_at,
          orders: customerOrders.slice(0, 5), // Last 5 orders
          last_order_date: lastOrder?.created_at || null,
          status,
        };
      });

      setCustomers(enrichedCustomers);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers' as any)
        .update({
          full_name: updates.full_name,
          email: updates.email,
          phone: updates.phone,
          address: updates.address,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...(data as any) } : c));
      toast.success('Customer updated successfully!');
      return data;
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
      throw error;
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return {
      total: customers.length,
      active: customers.filter(c => c.status === 'active').length,
      newThisMonth: customers.filter(c => {
        const joined = new Date(c.created_at);
        return joined.getMonth() === thisMonth && joined.getFullYear() === thisYear;
      }).length,
      totalRevenue: customers.reduce((sum, c) => sum + Number(c.total_spent), 0),
      avgSpent: customers.length > 0 
        ? Math.round(customers.reduce((sum, c) => sum + Number(c.total_spent), 0) / customers.length)
        : 0,
    };
  }, [customers]);

  useEffect(() => {
    fetchCustomers();

    // Set up realtime subscriptions
    const customersChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'customers' },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    const ordersChannel = supabase
      .channel('orders-for-customers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchCustomers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  return {
    customers,
    loading,
    stats,
    updateCustomer,
    refetch: fetchCustomers,
  };
}
