import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';
import { DateRangePreset, getDateRangeFromPreset } from '@/components/admin/DateRangeSelector';

export interface DashboardStats {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockProducts: number;
  salesChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
  // Previous period data for comparison
  previousSales: number;
  previousOrders: number;
  previousCustomers: number;
  // Monthly targets
  monthlySales: number;
  monthlyOrders: number;
  monthlyCustomers: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export interface TopProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string | null;
}

export interface SalesDataPoint {
  name: string;
  sales: number;
  orders: number;
}

export function useDashboardData(
  dateRangePreset: DateRangePreset = 'last30days',
  customRange?: { from: Date; to: Date }
) {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    pendingOrders: 0,
    lowStockProducts: 0,
    salesChange: 0,
    ordersChange: 0,
    customersChange: 0,
    productsChange: 0,
    previousSales: 0,
    previousOrders: 0,
    previousCustomers: 0,
    monthlySales: 0,
    monthlyOrders: 0,
    monthlyCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const initialFetchDone = useRef(false);

  const dateRange = getDateRangeFromPreset(dateRangePreset, customRange);

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  };

  const fetchStats = useCallback(async () => {
    try {
      const { from: rangeStart, to: rangeEnd } = dateRange;
      const rangeDuration = rangeEnd.getTime() - rangeStart.getTime();
      const previousStart = new Date(rangeStart.getTime() - rangeDuration);
      const previousEnd = new Date(rangeStart.getTime());

      // Current period orders
      const { data: currentOrders, error: currentOrdersError } = await supabase
        .from('orders' as any)
        .select('total_amount, status, created_at')
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString());

      if (currentOrdersError) throw currentOrdersError;

      // Previous period orders
      const { data: previousOrders, error: previousOrdersError } = await supabase
        .from('orders' as any)
        .select('total_amount, status, created_at')
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', previousEnd.toISOString());

      if (previousOrdersError) throw previousOrdersError;

      const currentOrdersData = (currentOrders as any[]) || [];
      const previousOrdersData = (previousOrders as any[]) || [];

      // All orders for total stats
      const { data: allOrders, error: allOrdersError } = await supabase
        .from('orders' as any)
        .select('total_amount, status');

      if (allOrdersError) throw allOrdersError;

      const allOrdersData = (allOrders as any[]) || [];
      const totalSales = allOrdersData.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const totalOrders = allOrdersData.length;
      const pendingOrders = allOrdersData.filter(o => o.status === 'pending').length;

      // Calculate period comparisons
      const currentPeriodSales = currentOrdersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const previousPeriodSales = previousOrdersData.reduce((sum, o) => sum + Number(o.total_amount), 0);
      const salesChange = calculateChange(currentPeriodSales, previousPeriodSales);

      const currentPeriodOrders = currentOrdersData.length;
      const previousPeriodOrders = previousOrdersData.length;
      const ordersChange = calculateChange(currentPeriodOrders, previousPeriodOrders);

      // Customers with period comparison
      const { count: totalCustomersCount } = await supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true });

      const { count: currentCustomersCount } = await supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', rangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString());

      const { count: previousCustomersCount } = await supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', previousEnd.toISOString());

      const customersChange = calculateChange(currentCustomersCount || 0, previousCustomersCount || 0);

      // Monthly stats (for goal tracking)
      const monthStart = startOfMonth(new Date());
      const { data: monthlyOrdersData } = await supabase
        .from('orders' as any)
        .select('total_amount')
        .gte('created_at', monthStart.toISOString());

      const { count: monthlyCustomersData } = await supabase
        .from('customers' as any)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      const monthlySales = ((monthlyOrdersData as any[]) || []).reduce((sum, o) => sum + Number(o.total_amount), 0);
      const monthlyOrders = ((monthlyOrdersData as any[]) || []).length;

      // Products stats
      const { data: products, error: productsError } = await supabase
        .from('products' as any)
        .select('quantity, created_at');

      if (productsError) throw productsError;

      const productsData = (products as any[]) || [];
      const totalProducts = productsData.length;
      const lowStockProducts = productsData.filter(p => (p.quantity || 0) < 10).length;

      const currentProducts = productsData.filter(p => 
        new Date(p.created_at) >= rangeStart && new Date(p.created_at) <= rangeEnd
      ).length;
      const previousProducts = productsData.filter(p => 
        new Date(p.created_at) >= previousStart && new Date(p.created_at) < previousEnd
      ).length;
      const productsChange = calculateChange(currentProducts, previousProducts);

      setStats({
        totalSales,
        totalOrders,
        totalCustomers: totalCustomersCount || 0,
        totalProducts,
        pendingOrders,
        lowStockProducts,
        salesChange,
        ordersChange,
        customersChange,
        productsChange,
        previousSales: previousPeriodSales,
        previousOrders: previousPeriodOrders,
        previousCustomers: previousCustomersCount || 0,
        monthlySales,
        monthlyOrders,
        monthlyCustomers: monthlyCustomersData || 0,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  }, [dateRange.from.getTime(), dateRange.to.getTime()]);

  const fetchSalesData = useCallback(async () => {
    try {
      const now = new Date();
      const monthsData: SalesDataPoint[] = [];

      // Fetch last 12 months of data
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));

        const { data: monthOrders, error } = await supabase
          .from('orders' as any)
          .select('total_amount')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (error) throw error;

        const ordersData = (monthOrders as any[]) || [];
        const monthSales = ordersData.reduce((sum, o) => sum + Number(o.total_amount), 0);

        monthsData.push({
          name: format(monthStart, 'MMM'),
          sales: monthSales,
          orders: ordersData.length,
        });
      }

      setSalesData(monthsData);
    } catch (error: any) {
      console.error('Error fetching sales data:', error);
    }
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders' as any)
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_status,
          created_at,
          customers (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const ordersWithCustomer = ((data as any[]) || []).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        customer_name: order.customers?.full_name || 'Unknown',
        total: Number(order.total_amount),
        status: order.status,
        payment_status: order.payment_status || 'pending',
        created_at: order.created_at,
      }));

      setRecentOrders(ordersWithCustomer);
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
    }
  }, []);

  const fetchTopProducts = useCallback(async () => {
    try {
      // Get products with their order counts
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items' as any)
        .select('product_id, quantity');

      if (itemsError) throw itemsError;

      // Aggregate sales by product
      const productSales: Record<string, number> = {};
      ((orderItems as any[]) || []).forEach((item: any) => {
        if (item.product_id) {
          productSales[item.product_id] = (productSales[item.product_id] || 0) + (item.quantity || 1);
        }
      });

      // Get top 5 product IDs by sales
      const topProductIds = Object.entries(productSales)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);

      if (topProductIds.length === 0) {
        // Fallback to products by stock
        const { data: fallbackProducts, error: fallbackError } = await supabase
          .from('products' as any)
          .select('id, name, price, quantity, category')
          .eq('is_active', true)
          .order('quantity', { ascending: false })
          .limit(5);

        if (fallbackError) throw fallbackError;

        setTopProducts(((fallbackProducts as any[]) || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          quantity: p.quantity || 0,
          category: p.category,
        })));
        return;
      }

      // Fetch product details
      const { data: products, error: productsError } = await supabase
        .from('products' as any)
        .select('id, name, price, quantity, category')
        .in('id', topProductIds);

      if (productsError) throw productsError;

      // Sort by sales and map
      const sortedProducts = topProductIds
        .map(id => (products as any[])?.find((p: any) => p.id === id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          quantity: productSales[p.id] || 0, // Show sold quantity
          category: p.category,
        }));

      setTopProducts(sortedProducts);
    } catch (error: any) {
      console.error('Error fetching top products:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchRecentOrders(), fetchTopProducts(), fetchSalesData()]);
    setLoading(false);
  }, [fetchStats, fetchRecentOrders, fetchTopProducts, fetchSalesData]);

  // Initial fetch on mount only
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchAllData();
    }
  }, []);

  // Refetch when date range changes
  useEffect(() => {
    if (initialFetchDone.current) {
      fetchStats();
    }
  }, [dateRangePreset, customRange?.from?.getTime(), customRange?.to?.getTime()]);

  return {
    stats,
    recentOrders,
    topProducts,
    salesData,
    loading,
    refetch: fetchAllData,
    dateRange,
  };
}
