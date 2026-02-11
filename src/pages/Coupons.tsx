import { useState, useMemo, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Ticket, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Copy,
  Calendar as CalendarIcon,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Zap,
  Tag,
  Gift,
  BarChart3,
  Eye,
  MoreVertical,
  RefreshCw,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";

// Updated interface to match DB schema
interface Coupon {
  id: string;
  code: string;
  title: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  minimum_order_amount: number | null;
  maximum_discount: number | null;
  max_uses: number | null;
  used_count: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UsageRecord {
  id: string;
  order_number: string;
  coupon_code: string | null;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
}

// Updated interface to match DB schema
interface AutoRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  condition: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean | null;
  min_order_value: number | null;
  max_discount: number | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const getCouponStatus = (coupon: Coupon): 'active' | 'scheduled' | 'expired' | 'disabled' => {
  if (!coupon.is_active) return 'disabled';
  
  const now = new Date();
  const startDate = coupon.starts_at ? new Date(coupon.starts_at) : null;
  const endDate = coupon.expires_at ? new Date(coupon.expires_at) : null;
  
  if (startDate && startDate > now) return 'scheduled';
  if (endDate && endDate < now) return 'expired';
  
  return 'active';
};

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800", icon: Clock },
  expired: { label: "Expired", color: "bg-gray-100 text-gray-800", icon: XCircle },
  disabled: { label: "Disabled", color: "bg-red-100 text-red-800", icon: XCircle },
};

const discountTypeConfig: Record<string, { label: string; icon: any }> = {
  percentage: { label: "Percentage", icon: Percent },
  fixed: { label: "Fixed Amount", icon: DollarSign },
  free_shipping: { label: "Free Shipping", icon: Gift },
};

export default function Coupons() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [deleteCouponItem, setDeleteCouponItem] = useState<Coupon | null>(null);
  const [deleteRuleItem, setDeleteRuleItem] = useState<AutoRule | null>(null);

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    title: "",
    description: "",
    discount_type: "percentage" as string,
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount: 0,
    max_uses: 100,
  });

  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    rule_type: "cart_total",
    condition: "",
    discount_type: "percentage",
    discount_value: 0
  });

  // Fetch coupons from database
  const { data: coupons = [], isLoading: couponsLoading, refetch: refetchCoupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as Coupon[];
    }
  });

  // Fetch usage records (orders with coupon codes)
  const { data: usageRecords = [], isLoading: usageLoading } = useQuery({
    queryKey: ['coupon-usage-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          coupon_code,
          discount_amount,
          total_amount,
          created_at,
          customers (
            full_name,
            email
          )
        `)
        .not('coupon_code', 'is', null)
        .gt('discount_amount', 0)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      return ((data || []) as any[]).map((order: any) => ({
        id: order.id,
        order_number: order.order_number,
        coupon_code: order.coupon_code,
        discount_amount: order.discount_amount || 0,
        total_amount: order.total_amount || 0,
        created_at: order.created_at,
        customer_name: order.customers?.full_name || 'Guest',
        customer_email: order.customers?.email || 'N/A'
      })) as UsageRecord[];
    }
  });

  // Fetch auto rules from database
  const { data: autoRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['auto-discount-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('auto_discount_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as AutoRule[];
    }
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (couponData: {
      code: string;
      title: string | null;
      description: string | null;
      discount_type: string;
      discount_value: number;
      minimum_order_amount: number | null;
      maximum_discount: number | null;
      max_uses: number | null;
      starts_at: string | null;
      expires_at: string | null;
    }) => {
      const { data, error } = await supabase
        .from('coupons')
        .insert([couponData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      setCouponDialogOpen(false);
      setNewCoupon({
        code: "",
        title: "",
        description: "",
        discount_type: "percentage",
        discount_value: 0,
        minimum_order_amount: 0,
        maximum_discount: 0,
        max_uses: 100,
      });
      setStartDate(undefined);
      setEndDate(undefined);
      toast.success("Coupon created successfully");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("This code already exists");
      } else {
        toast.error("Failed to create coupon");
      }
    }
  });

  // Create auto rule mutation
  const createRuleMutation = useMutation({
    mutationFn: async (ruleData: {
      name: string;
      description: string | null;
      rule_type: string;
      condition: string;
      discount_type: string;
      discount_value: number;
    }) => {
      const { data, error } = await supabase
        .from('auto_discount_rules')
        .insert([{
          name: ruleData.name,
          description: ruleData.description,
          rule_type: ruleData.rule_type,
          min_purchase: ruleData.condition ? parseFloat(ruleData.condition) : null,
          discount_type: ruleData.discount_type,
          discount_value: ruleData.discount_value,
          is_active: true
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-discount-rules'] });
      setRuleDialogOpen(false);
      setNewRule({
        name: "",
        description: "",
        rule_type: "cart_total",
        condition: "",
        discount_type: "percentage",
        discount_value: 0
      });
      toast.success("Auto rule created successfully");
    },
    onError: () => {
      toast.error("Failed to create rule");
    }
  });

  // Toggle coupon status mutation
  const toggleCouponMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Coupon status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });

  // Toggle rule status mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('auto_discount_rules')
        .update({ is_active })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-discount-rules'] });
      toast.success("Rule status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success("Coupon deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete coupon");
    }
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('auto_discount_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-discount-rules'] });
      toast.success("Rule deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete rule");
    }
  });

  const stats = useMemo(() => {
    const activeCoupons = coupons.filter(c => getCouponStatus(c) === 'active').length;
    const totalUsage = coupons.reduce((acc, c) => acc + (c.used_count || 0), 0);
    const totalSavings = usageRecords.reduce((acc, r) => acc + r.discount_amount, 0);
    const activeRules = autoRules.filter(r => r.is_active).length;
    
    return {
      totalCoupons: coupons.length,
      activeCoupons,
      totalUsage,
      totalSavings,
      activeRules
    };
  }, [coupons, usageRecords, autoRules]);

  const filteredCoupons = coupons.filter(coupon => {
    const status = getCouponStatus(coupon);
    const matchesSearch = coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (coupon.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCoupon({ ...newCoupon, code });
  };

  const handleCreateCoupon = () => {
    if (!newCoupon.code || newCoupon.discount_value === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    createCouponMutation.mutate({
      code: newCoupon.code.toUpperCase(),
      title: newCoupon.title || null,
      description: newCoupon.description || null,
      discount_type: newCoupon.discount_type,
      discount_value: newCoupon.discount_value,
      minimum_order_amount: newCoupon.minimum_order_amount || null,
      maximum_discount: newCoupon.maximum_discount || null,
      max_uses: newCoupon.max_uses || null,
      starts_at: startDate ? startDate.toISOString() : null,
      expires_at: endDate ? endDate.toISOString() : null,
    });
  };

  const handleCreateRule = () => {
    if (!newRule.name || newRule.discount_value === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    createRuleMutation.mutate({
      name: newRule.name,
      description: newRule.description || null,
      rule_type: newRule.rule_type,
      condition: newRule.condition || '',
      discount_type: newRule.discount_type,
      discount_value: newRule.discount_value,
    });
  };

  const toggleCoupon = (coupon: Coupon) => {
    toggleCouponMutation.mutate({ id: coupon.id, is_active: !coupon.is_active });
  };

  const toggleRule = (rule: AutoRule) => {
    toggleRuleMutation.mutate({ id: rule.id, is_active: !rule.is_active });
  };

  const deleteCoupon = (couponId: string) => {
    deleteCouponMutation.mutate(couponId);
    setDeleteCouponItem(null);
  };

  const deleteRule = (ruleId: string) => {
    deleteRuleMutation.mutate(ruleId);
    setDeleteRuleItem(null);
  };


  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied");
  };

  const getUsagePercentage = (used: number | null, limit: number | null) => {
    if (!limit) return 0;
    return Math.min(((used || 0) / limit) * 100, 100);
  };

  const ruleTypeLabels: Record<string, string> = {
    cart_total: "Cart Value",
    first_order: "First Order",
    birthday: "Birthday",
    loyalty_tier: "Loyalty Tier",
    abandoned_cart: "Abandoned Cart",
    bulk_purchase: "Bulk Purchase"
  };

  if (couponsLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Discounts & Coupons</h1>
            <p className="text-muted-foreground">Create coupons and set automatic discount rules</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRuleDialogOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Auto Rule
            </Button>
            <Button onClick={() => setCouponDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Coupon
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ticket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCoupons}</p>
                  <p className="text-xs text-muted-foreground">Total Coupons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeCoupons}</p>
                  <p className="text-xs text-muted-foreground">Active Coupons</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsage}</p>
                  <p className="text-xs text-muted-foreground">Total Usage</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">৳{stats.totalSavings.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Savings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="coupons" className="space-y-4">
          <TabsList>
            <TabsTrigger value="coupons" className="gap-2">
              <Ticket className="h-4 w-4" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="auto-rules" className="gap-2">
              <Zap className="h-4 w-4" />
              Auto Rules
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Usage History
            </TabsTrigger>
          </TabsList>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupon code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Coupons Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coupon Code</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Validity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCoupons.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <Ticket className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No coupons found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCoupons.map((coupon) => {
                        const status = getCouponStatus(coupon);
                        const StatusIcon = statusConfig[status].icon;
                        const DiscountIcon = discountTypeConfig[coupon.discount_type]?.icon || Percent;

                        return (
                          <TableRow key={coupon.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                                  {coupon.code}
                                </code>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCouponCode(coupon.code)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              {coupon.description && (
                                <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DiscountIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {coupon.discount_type === 'percentage' 
                                    ? `${coupon.discount_value}%` 
                                    : `৳${coupon.discount_value}`}
                                </span>
                              </div>
                              {coupon.minimum_order_amount && coupon.minimum_order_amount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Min: ৳{coupon.minimum_order_amount}
                                </p>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">
                                  {coupon.used_count || 0}/{coupon.max_uses || '∞'}
                                </p>
                                <Progress value={getUsagePercentage(coupon.used_count, coupon.max_uses)} className="h-1" />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {coupon.starts_at && (
                                  <p>Start: {format(new Date(coupon.starts_at), 'dd MMM yyyy')}</p>
                                )}
                                {coupon.expires_at ? (
                                  <p className="text-muted-foreground">End: {format(new Date(coupon.expires_at), 'dd MMM yyyy')}</p>
                                ) : (
                                  <p className="text-muted-foreground">No expiry</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={statusConfig[status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => toggleCoupon(coupon)}>
                                    {coupon.is_active ? 'Disable' : 'Enable'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => setDeleteCouponItem(coupon)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auto Rules Tab */}
          <TabsContent value="auto-rules" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autoRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No auto rules found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      autoRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <p className="font-medium">{rule.name}</p>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground">{rule.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ruleTypeLabels[rule.rule_type] || rule.rule_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {rule.discount_type === 'percentage' 
                                ? `${rule.discount_value}%` 
                                : `৳${rule.discount_value}`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Switch 
                              checked={rule.is_active || false}
                              onCheckedChange={() => toggleRule(rule)}
                            />
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteRuleItem(rule)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage History Tab */}
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Coupon</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No usage history found</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      usageRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.order_number}</TableCell>
                          <TableCell>
                            <p>{record.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{record.customer_email}</p>
                          </TableCell>
                          <TableCell>
                            <code className="font-mono bg-muted px-2 py-1 rounded text-sm">
                              {record.coupon_code}
                            </code>
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            -৳{record.discount_amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(record.created_at), 'dd MMM yyyy')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Coupon Dialog */}
        <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Create a new discount coupon code
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE20"
                  />
                  <Button variant="outline" onClick={generateCouponCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCoupon.description}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="Description of this coupon..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={newCoupon.discount_type} onValueChange={(v) => setNewCoupon({ ...newCoupon, discount_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={newCoupon.discount_value}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Order (৳)</Label>
                  <Input
                    type="number"
                    value={newCoupon.minimum_order_amount}
                    onChange={(e) => setNewCoupon({ ...newCoupon, minimum_order_amount: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon({ ...newCoupon, max_uses: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, 'dd MMM yyyy') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCoupon} disabled={createCouponMutation.isPending}>
                {createCouponMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Auto Rule Dialog */}
        <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Auto Rule</DialogTitle>
              <DialogDescription>
                Create an automatic discount rule
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Name</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="10% off on orders above 1000"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Description of this rule..."
                />
              </div>
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select value={newRule.rule_type} onValueChange={(v) => setNewRule({ ...newRule, rule_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cart_total">Cart Value</SelectItem>
                    <SelectItem value="first_order">First Order</SelectItem>
                    <SelectItem value="bulk_purchase">Bulk Purchase</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Input
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  placeholder="cart_total >= 1000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={newRule.discount_type} onValueChange={(v) => setNewRule({ ...newRule, discount_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <Input
                    type="number"
                    value={newRule.discount_value}
                    onChange={(e) => setNewRule({ ...newRule, discount_value: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRule} disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Coupon Confirmation */}
        <DeleteConfirmModal
          open={!!deleteCouponItem}
          onOpenChange={() => setDeleteCouponItem(null)}
          onConfirm={() => deleteCouponItem && deleteCoupon(deleteCouponItem.id)}
          title="Delete Coupon"
          itemName={deleteCouponItem?.code}
        />

        {/* Delete Rule Confirmation */}
        <DeleteConfirmModal
          open={!!deleteRuleItem}
          onOpenChange={() => setDeleteRuleItem(null)}
          onConfirm={() => deleteRuleItem && deleteRule(deleteRuleItem.id)}
          title="Delete Auto Rule"
          itemName={deleteRuleItem?.name}
        />
      </div>
    </AdminLayout>
  );
}
