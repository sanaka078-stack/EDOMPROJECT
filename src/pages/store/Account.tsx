import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Package, 
  MapPin, 
  Settings, 
  LogOut, 
  ChevronRight,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Camera,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  Mail,
  Home,
  Copy,
  Check,
  Download,
  Edit,
  Trash2,
  Star,
  Plus,
  Building2,
  Lock,
  Bell,
  Tag,
  ShoppingBag,
  TrendingDown,
  HelpCircle
} from 'lucide-react';
import { generateInvoicePDF } from '@/utils/generateInvoicePDF';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CustomerSupportTickets } from '@/components/store/CustomerSupportTickets';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  payment_status: string;
  payment_method: string;
  shipping_address: any;
  items: {
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  street: string;
  area: string | null;
  city: string;
  postal_code: string | null;
  is_default: boolean;
  is_default_shipping: boolean;
  is_default_billing: boolean;
  address_type: 'shipping' | 'billing' | 'both';
}

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  company_name: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  language_preference: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  full_name: z.string().min(2, 'Full name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  street: z.string().min(5, 'Street address is required'),
  area: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  postal_code: z.string().optional(),
  address_type: z.enum(['shipping', 'billing', 'both']),
});

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

// Helper to get address string from any type
const getAddressString = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [addr.street, addr.area, addr.city].filter(Boolean);
    return parts.join(', ');
  }
  return '';
};

// Helper to get city from address
const getCityFromAddress = (addr: any): string => {
  if (!addr) return '';
  if (typeof addr === 'object' && addr.city) return addr.city;
  return '';
};

const downloadInvoiceForOrder = (order: Order) => {
  const invoiceData = {
    order_number: order.order_number,
    created_at: order.created_at,
    customer_name: order.shipping_address?.name || 'Customer',
    customer_email: order.shipping_address?.email || '',
    customer_phone: order.shipping_address?.phone || '',
    shipping_address: [
      order.shipping_address?.street,
      order.shipping_address?.city,
      order.shipping_address?.postal_code,
    ]
      .filter(Boolean)
      .join(', '),
    items: order.items,
    subtotal: order.subtotal,
    shipping_cost: order.shipping_cost,
    discount: order.discount_amount,
    total: order.total,
    payment_method: order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method,
    payment_status: order.payment_status,
  };

  generateInvoicePDF(invoiceData);
};

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<Address | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notifications, setNotifications] = useState({
    order_updates: true,
    order_shipped: true,
    order_delivered: true,
    promotions: false,
    new_arrivals: false,
    price_drops: false,
    account_activity: true,
  });

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: null as 'male' | 'female' | 'other' | 'prefer_not_to_say' | null,
      company_name: '',
      bio: '',
      language_preference: 'en',
    },
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: '',
      full_name: '',
      phone: '',
      street: '',
      area: '',
      city: '',
      postal_code: '',
      address_type: 'shipping' as 'shipping' | 'billing' | 'both',
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setAvatarUrl(profileData.avatar_url);
        profileForm.reset({
          full_name: profileData.full_name || '',
          email: user.email || '',
          phone: profileData.phone || '',
          date_of_birth: profileData.date_of_birth || '',
          gender: (profileData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | null) || null,
          company_name: profileData.company_name || '',
          bio: profileData.bio || '',
          language_preference: profileData.language_preference || 'en',
        });
        // Load notification preferences
        setNotifications({
          order_updates: profileData.notify_order_updates ?? true,
          order_shipped: profileData.notify_order_shipped ?? true,
          order_delivered: profileData.notify_order_delivered ?? true,
          promotions: profileData.notify_promotions ?? false,
          new_arrivals: profileData.notify_new_arrivals ?? false,
          price_drops: profileData.notify_price_drops ?? false,
          account_activity: profileData.notify_account_activity ?? true,
        });
      }

      // Fetch user addresses from user_addresses table
      const { data: addressesData } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (addressesData) {
        setAddresses(addressesData.map((addr: any) => ({
          id: addr.id,
          label: addr.label,
          full_name: addr.full_name,
          phone: addr.phone,
          street: addr.street_address,
          area: addr.area,
          city: addr.city,
          postal_code: addr.postal_code,
          is_default: addr.is_default ?? false,
          is_default_shipping: addr.is_default ?? false,
          is_default_billing: addr.is_default ?? false,
          address_type: 'both' as const,
        })));
      }

      // Fetch customer data with orders
      const { data: customerData } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (customerData) {
        // Fetch orders for this customer
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('customer_id', customerData.id)
          .order('created_at', { ascending: false });

        if (ordersData) {
          // Fetch order items for each order
          const ordersWithItems = await Promise.all(
            ordersData.map(async (order) => {
              const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id);
              
              return { 
                id: order.id,
                order_number: order.order_number,
                created_at: order.created_at,
                status: order.status,
                total: Number((order as any).total || (order as any).total_amount || 0),
                subtotal: Number(order.subtotal || 0),
                shipping_cost: Number(order.shipping_cost || 0),
                discount_amount: Number(order.discount_amount || 0),
                payment_status: order.payment_status,
                payment_method: order.payment_method || 'N/A',
                shipping_address: order.shipping_address,
                items: (items || []).map(i => ({
                  id: i.id,
                  product_name: i.product_name,
                  quantity: i.quantity,
                  unit_price: Number(i.unit_price),
                  total_price: Number(i.total_price),
                })),
              };
            })
          );
          setOrders(ordersWithItems);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: 'Success', description: 'Avatar updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onProfileSubmit = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          phone: values.phone || null,
          date_of_birth: values.date_of_birth || null,
          gender: values.gender || null,
          company_name: values.company_name || null,
          bio: values.bio || null,
          language_preference: values.language_preference || 'en',
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Profile updated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (values: z.infer<typeof passwordSchema>) => {
    if (!user) return;

    setSavingPassword(true);
    try {
      // First verify current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: values.current_password,
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.new_password,
      });

      if (updateError) throw updateError;

      toast({ title: 'Success', description: 'Password updated successfully' });
      passwordForm.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleNotificationChange = async (key: keyof typeof notifications, value: boolean) => {
    if (!user) return;

    // Update local state immediately for responsiveness
    setNotifications(prev => ({ ...prev, [key]: value }));
    setSavingNotifications(true);

    try {
      const updateData: Record<string, boolean> = {};
      updateData[`notify_${key}`] = value;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({ title: 'Saved', description: 'Notification preference updated' });
    } catch (error: any) {
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !value }));
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleAddressSubmit = async (values: z.infer<typeof addressSchema>) => {
    if (!user) return;

    setSavingAddress(true);
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from('user_addresses')
          .update({
            label: values.label,
            full_name: values.full_name,
            phone: values.phone,
            street: values.street,
            area: values.area || null,
            city: values.city,
            postal_code: values.postal_code || null,
            address_type: values.address_type,
          })
          .eq('id', editingAddress.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Address updated successfully' });
      } else {
        // Insert new address
        const isFirstAddress = addresses.length === 0;
        const { error } = await supabase
          .from('user_addresses')
          .insert({
            user_id: user.id,
            label: values.label,
            full_name: values.full_name,
            phone: values.phone,
            street_address: values.street,
            area: values.area || null,
            city: values.city,
            postal_code: values.postal_code || null,
            is_default: isFirstAddress,
          });

        if (error) throw error;
        toast({ title: 'Success', description: 'New address added successfully' });
      }

      setAddressDialogOpen(false);
      setEditingAddress(null);
      addressForm.reset();
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddress) return;

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', deletingAddress.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Address deleted successfully' });
      setDeletingAddress(null);
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSetDefaultShipping = async (address: Address) => {
    try {
      // First, unset all other defaults
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user?.id);
        
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Default address set successfully' });
      fetchData();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSetDefaultBilling = async (address: Address) => {
    // Same as shipping for now since we only have is_default
    await handleSetDefaultShipping(address);
  };

  const openEditAddressDialog = (address: Address) => {
    setEditingAddress(address);
    addressForm.reset({
      label: address.label,
      full_name: address.full_name,
      phone: address.phone,
      street: address.street,
      area: address.area || '',
      city: address.city,
      postal_code: address.postal_code || '',
      address_type: address.address_type,
    });
    setAddressDialogOpen(true);
  };

  const openNewAddressDialog = () => {
    setEditingAddress(null);
    addressForm.reset({
      label: '',
      full_name: '',
      phone: '',
      street: '',
      area: '',
      city: '',
      postal_code: '',
      address_type: 'shipping',
    });
    setAddressDialogOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-store-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-store-light to-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-16 w-16 border-4 border-store-primary/20">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-store text-white text-lg">
                    {getInitials(profile?.full_name || user.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="sr-only"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {profile?.full_name || 'Welcome!'}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="addresses" className="gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </TabsTrigger>
              <TabsTrigger value="support" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                Support
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View and track your recent orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No orders yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start shopping to see your orders here
                      </p>
                      <Button onClick={() => navigate('/store/products')} className="bg-gradient-store">
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = status.icon;
                        return (
                          <div
                            key={order.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <p className="font-semibold text-lg">{order.order_number}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(order.created_at)}
                                </div>
                              </div>
                              <Badge className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span>
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span className="font-medium">৳{item.total_price.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            <Separator className="my-4" />

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  <span className="capitalize">{order.payment_status}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-lg">
                                  Total: ৳{order.total.toFixed(2)}
                                </p>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setOrderDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Details
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => navigate(`/track/${order.order_number}`)}
                                >
                                  <Truck className="h-4 w-4 mr-1" />
                                  Track
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order Details Modal */}
            <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order Details
                  </DialogTitle>
                  <DialogDescription>
                    Complete information about your order
                  </DialogDescription>
                </DialogHeader>

                {selectedOrder && (
                  <div className="space-y-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-semibold text-lg">
                            {selectedOrder.order_number}
                          </span>
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(selectedOrder.order_number);
                              setCopiedOrderNumber(true);
                              setTimeout(() => setCopiedOrderNumber(false), 2000);
                            }}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Copy order number"
                          >
                            {copiedOrderNumber ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(selectedOrder.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={statusConfig[selectedOrder.status]?.color || statusConfig.pending.color}>
                          {statusConfig[selectedOrder.status]?.label || 'Pending'}
                        </Badge>
                        <div className="mt-2">
                          <Badge variant={selectedOrder.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {selectedOrder.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Shipping Address
                      </h4>
                      {selectedOrder.shipping_address && (
                        <div className="p-4 border rounded-lg space-y-2 text-sm">
                          <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {selectedOrder.shipping_address.phone}
                          </div>
                          {selectedOrder.shipping_address.email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {selectedOrder.shipping_address.email}
                            </div>
                          )}
                          <div className="flex items-start gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3 mt-1" />
                            <span>
                              {selectedOrder.shipping_address.street}
                              {selectedOrder.shipping_address.city && `, ${selectedOrder.shipping_address.city}`}
                              {selectedOrder.shipping_address.postal_code && ` - ${selectedOrder.shipping_address.postal_code}`}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Items ({selectedOrder.items.length})
                      </h4>
                      <div className="border rounded-lg divide-y">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                ৳{item.unit_price.toFixed(2)} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold">৳{item.total_price.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Summary
                      </h4>
                      <div className="p-4 border rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Payment Method</span>
                          <span className="capitalize font-medium">
                            {selectedOrder.payment_method === 'cod' ? 'Cash on Delivery' : selectedOrder.payment_method}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>৳{selectedOrder.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shipping</span>
                          <span>৳{selectedOrder.shipping_cost.toFixed(2)}</span>
                        </div>
                        {selectedOrder.discount_amount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount</span>
                            <span>-৳{selectedOrder.discount_amount.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-store-primary">৳{selectedOrder.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => downloadInvoiceForOrder(selectedOrder)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Invoice
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setOrderDetailsOpen(false);
                          navigate(`/track/${selectedOrder.order_number}`);
                        }}
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setOrderDetailsOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <TabsContent value="addresses" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Saved Addresses</CardTitle>
                    <CardDescription>Manage your shipping and billing addresses</CardDescription>
                  </div>
                  <Button onClick={openNewAddressDialog} className="bg-gradient-store">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <div className="text-center py-12">
                      <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium text-lg mb-2">No addresses saved</h3>
                      <p className="text-muted-foreground mb-4">
                        Add an address for faster checkout
                      </p>
                      <Button onClick={openNewAddressDialog} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Address
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className={`border rounded-lg p-4 relative transition-all hover:shadow-md ${
                            (address.is_default_shipping || address.is_default_billing) ? 'border-store-primary bg-store-primary/5' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={(address.is_default_shipping || address.is_default_billing) ? 'default' : 'secondary'} className={(address.is_default_shipping || address.is_default_billing) ? 'bg-store-primary' : ''}>
                                {address.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs capitalize">
                                {address.address_type === 'both' ? (
                                  <>
                                    <Truck className="h-3 w-3 mr-1" />
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Both
                                  </>
                                ) : address.address_type === 'billing' ? (
                                  <>
                                    <Building2 className="h-3 w-3 mr-1" />
                                    Billing
                                  </>
                                ) : (
                                  <>
                                    <Truck className="h-3 w-3 mr-1" />
                                    Shipping
                                  </>
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditAddressDialog(address)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeletingAddress(address)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Default badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {address.is_default_shipping && (
                              <Badge variant="outline" className="text-xs border-green-500 text-green-600 bg-green-50">
                                <Truck className="h-3 w-3 mr-1" />
                                Default Shipping
                              </Badge>
                            )}
                            {address.is_default_billing && (
                              <Badge variant="outline" className="text-xs border-blue-500 text-blue-600 bg-blue-50">
                                <Building2 className="h-3 w-3 mr-1" />
                                Default Billing
                              </Badge>
                            )}
                          </div>

                          {/* Set as default buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(address.address_type === 'shipping' || address.address_type === 'both') && !address.is_default_shipping && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleSetDefaultShipping(address)}
                              >
                                <Truck className="h-3 w-3 mr-1" />
                                Set Default Shipping
                              </Button>
                            )}
                            {(address.address_type === 'billing' || address.address_type === 'both') && !address.is_default_billing && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleSetDefaultBilling(address)}
                              >
                                <Building2 className="h-3 w-3 mr-1" />
                                Set Default Billing
                              </Button>
                            )}
                          </div>

                          <div className="space-y-1">
                            <p className="font-medium">{address.full_name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {address.phone}
                            </div>
                            <div className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Home className="h-3 w-3 mt-0.5" />
                              <span>
                                {address.street}
                                {address.area && `, ${address.area}`}
                                {address.city && `, ${address.city}`}
                                {address.postal_code && ` - ${address.postal_code}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Address Dialog */}
              <Dialog open={addressDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  setEditingAddress(null);
                  addressForm.reset();
                }
                setAddressDialogOpen(open);
              }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingAddress ? 'Update your address details' : 'Add a new delivery address to your account'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...addressForm}>
                    <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="label"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Label</FormLabel>
                              <FormControl>
                                <Input placeholder="Home, Office, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="address_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="shipping">
                                    <div className="flex items-center gap-2">
                                      <Truck className="h-4 w-4" />
                                      Shipping
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="billing">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4" />
                                      Billing
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="both">
                                    <div className="flex items-center gap-2">
                                      <Truck className="h-4 w-4" />
                                      <Building2 className="h-4 w-4" />
                                      Both
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input placeholder="01XXXXXXXXX" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={addressForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="House #, Road #, Area" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addressForm.control}
                        name="area"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Area name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={addressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Dhaka" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={addressForm.control}
                          name="postal_code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="1205" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddressDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-gradient-store" disabled={savingAddress}>
                          {savingAddress && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          {editingAddress ? 'Update' : 'Save'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={!!deletingAddress} onOpenChange={(open) => !open && setDeletingAddress(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This address will be permanently deleted. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAddress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            {/* Support Tab */}
            <TabsContent value="support" className="space-y-4">
              <CustomerSupportTickets />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>Update your account information</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="full_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="your@email.com" {...field} disabled className="bg-muted" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input placeholder="01XXXXXXXXX" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="date_of_birth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Personal Details */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Personal Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="company_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Your company (optional)" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <textarea
                                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Tell us a little about yourself..."
                                  maxLength={500}
                                  {...field}
                                />
                              </FormControl>
                              <p className="text-xs text-muted-foreground text-right">
                                {(field.value?.length || 0)}/500 characters
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Preferences */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-muted-foreground">Preferences</h3>
                        <FormField
                          control={profileForm.control}
                          name="language_preference"
                          render={({ field }) => (
                            <FormItem className="max-w-xs">
                              <FormLabel>Language</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || 'en'}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="pt-4">
                        <Button type="submit" disabled={savingProfile} className="bg-gradient-store">
                          {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Password Change Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="current_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showCurrentPassword ? "text" : "password"} 
                                  placeholder="Enter current password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                  {showCurrentPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="new_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showNewPassword ? "text" : "password"} 
                                  placeholder="Enter new password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                >
                                  {showNewPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Must be at least 8 characters with uppercase, lowercase, and number
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirm_password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm New Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder="Confirm new password" 
                                  {...field} 
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={savingPassword} className="bg-gradient-store">
                        {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Update Password
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Notification Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Manage your email notification settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Notifications
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="order_updates">Order Updates</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive notifications about order status changes
                          </p>
                        </div>
                        <Switch
                          id="order_updates"
                          checked={notifications.order_updates}
                          onCheckedChange={(checked) => handleNotificationChange('order_updates', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="order_shipped">Shipping Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when your order is shipped
                          </p>
                        </div>
                        <Switch
                          id="order_shipped"
                          checked={notifications.order_shipped}
                          onCheckedChange={(checked) => handleNotificationChange('order_shipped', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="order_delivered">Delivery Notifications</Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified when your order is delivered
                          </p>
                        </div>
                        <Switch
                          id="order_delivered"
                          checked={notifications.order_delivered}
                          onCheckedChange={(checked) => handleNotificationChange('order_delivered', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Marketing Notifications */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Marketing & Promotions
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="promotions">Promotions & Offers</Label>
                          <p className="text-xs text-muted-foreground">
                            Receive exclusive deals and discount offers
                          </p>
                        </div>
                        <Switch
                          id="promotions"
                          checked={notifications.promotions}
                          onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="new_arrivals" className="flex items-center gap-2">
                            <ShoppingBag className="h-3 w-3" />
                            New Arrivals
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Be the first to know about new products
                          </p>
                        </div>
                        <Switch
                          id="new_arrivals"
                          checked={notifications.new_arrivals}
                          onCheckedChange={(checked) => handleNotificationChange('new_arrivals', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="price_drops" className="flex items-center gap-2">
                            <TrendingDown className="h-3 w-3" />
                            Price Drops
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Get alerts when prices drop on items you've viewed
                          </p>
                        </div>
                        <Switch
                          id="price_drops"
                          checked={notifications.price_drops}
                          onCheckedChange={(checked) => handleNotificationChange('price_drops', checked)}
                          disabled={savingNotifications}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Account & Security */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Account & Security
                    </h3>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="account_activity">Account Activity</Label>
                        <p className="text-xs text-muted-foreground">
                          Get notified about login attempts and security alerts
                        </p>
                      </div>
                      <Switch
                        id="account_activity"
                        checked={notifications.account_activity}
                        onCheckedChange={(checked) => handleNotificationChange('account_activity', checked)}
                        disabled={savingNotifications}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
