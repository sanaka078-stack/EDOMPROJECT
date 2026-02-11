import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Shield, ShoppingCart, Package, Users, Star, CreditCard, Bell, Lock, Smartphone, Key, Globe, AlertTriangle, UserCheck, RefreshCw, Truck, MessageSquare, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface EmailNotificationCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  notifications: EmailNotification[];
}

interface EmailNotification {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  recipient: 'admin' | 'customer' | 'both';
}

const defaultNotificationSettings: Record<string, boolean> = {
  // Security
  loginAlert: true,
  suspiciousLogin: true,
  newDeviceLogin: true,
  accountLocked: true,
  accountUnlocked: true,
  passwordChanged: true,
  twoFactorEnabled: true,
  twoFactorDisabled: true,
  sessionTerminated: true,
  ipBlocked: true,
  geoBlocked: true,
  
  // Orders
  newOrder: true,
  orderConfirmation: true,
  orderStatusChanged: true,
  orderCancelled: true,
  orderRefunded: true,
  paymentReceived: true,
  paymentFailed: true,
  
  // Shipping
  orderShipped: true,
  orderDelivered: true,
  shippingDelayed: false,
  trackingUpdated: true,
  
  // Customer
  newCustomer: true,
  customerWelcome: true,
  abandonedCart: false,
  
  // Reviews & Feedback
  newReview: true,
  reviewApproved: true,
  lowRatingAlert: true,
  
  // Inventory
  lowStockAlert: true,
  outOfStock: true,
  stockReplenished: false,
  
  // Admin Reports
  dailySalesReport: false,
  weeklySummary: false,
  monthlyReport: false,
};

export function AllEmailNotifications() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(defaultNotificationSettings);

  const categories: EmailNotificationCategory[] = [
    {
      id: 'security',
      title: 'Security Alerts',
      description: 'Account security and login notifications',
      icon: Shield,
      iconColor: 'text-red-500',
      notifications: [
        { id: 'loginAlert', name: 'Login Alerts', description: 'Notify on every successful login', enabled: notifications.loginAlert, recipient: 'customer' },
        { id: 'suspiciousLogin', name: 'Suspicious Login Detection', description: 'Block and verify logins from unknown devices', enabled: notifications.suspiciousLogin, recipient: 'customer' },
        { id: 'newDeviceLogin', name: 'New Device Login', description: 'Alert when login from a new device', enabled: notifications.newDeviceLogin, recipient: 'customer' },
        { id: 'accountLocked', name: 'Account Locked', description: 'Alert when account is locked due to failed attempts', enabled: notifications.accountLocked, recipient: 'both' },
        { id: 'accountUnlocked', name: 'Account Unlocked', description: 'Notify when account is unlocked', enabled: notifications.accountUnlocked, recipient: 'both' },
        { id: 'passwordChanged', name: 'Password Changed', description: 'Confirm password change to user', enabled: notifications.passwordChanged, recipient: 'customer' },
        { id: 'twoFactorEnabled', name: '2FA Enabled', description: 'Notify when two-factor auth is enabled', enabled: notifications.twoFactorEnabled, recipient: 'customer' },
        { id: 'twoFactorDisabled', name: '2FA Disabled', description: 'Alert when two-factor auth is disabled', enabled: notifications.twoFactorDisabled, recipient: 'customer' },
        { id: 'sessionTerminated', name: 'Session Terminated', description: 'Alert when session is ended remotely', enabled: notifications.sessionTerminated, recipient: 'customer' },
        { id: 'ipBlocked', name: 'IP Blocked', description: 'Notify admin when IP is blocked', enabled: notifications.ipBlocked, recipient: 'admin' },
        { id: 'geoBlocked', name: 'Geo-Block Attempt', description: 'Alert when blocked country tries to access', enabled: notifications.geoBlocked, recipient: 'admin' },
      ],
    },
    {
      id: 'orders',
      title: 'Order Notifications',
      description: 'Order placement and status updates',
      icon: ShoppingCart,
      iconColor: 'text-blue-500',
      notifications: [
        { id: 'newOrder', name: 'New Order (Admin)', description: 'Notify admin when new order is placed', enabled: notifications.newOrder, recipient: 'admin' },
        { id: 'orderConfirmation', name: 'Order Confirmation', description: 'Send confirmation to customer', enabled: notifications.orderConfirmation, recipient: 'customer' },
        { id: 'orderStatusChanged', name: 'Order Status Changed', description: 'Notify customer on status updates', enabled: notifications.orderStatusChanged, recipient: 'customer' },
        { id: 'orderCancelled', name: 'Order Cancelled', description: 'Notify when order is cancelled', enabled: notifications.orderCancelled, recipient: 'both' },
        { id: 'orderRefunded', name: 'Order Refunded', description: 'Confirm refund to customer', enabled: notifications.orderRefunded, recipient: 'customer' },
        { id: 'paymentReceived', name: 'Payment Received', description: 'Confirm payment received', enabled: notifications.paymentReceived, recipient: 'both' },
        { id: 'paymentFailed', name: 'Payment Failed', description: 'Alert on payment failure', enabled: notifications.paymentFailed, recipient: 'both' },
      ],
    },
    {
      id: 'shipping',
      title: 'Shipping Updates',
      description: 'Delivery and tracking notifications',
      icon: Truck,
      iconColor: 'text-green-500',
      notifications: [
        { id: 'orderShipped', name: 'Order Shipped', description: 'Notify when order is shipped', enabled: notifications.orderShipped, recipient: 'customer' },
        { id: 'orderDelivered', name: 'Order Delivered', description: 'Confirm delivery to customer', enabled: notifications.orderDelivered, recipient: 'customer' },
        { id: 'shippingDelayed', name: 'Shipping Delayed', description: 'Alert on shipping delays', enabled: notifications.shippingDelayed, recipient: 'customer' },
        { id: 'trackingUpdated', name: 'Tracking Updated', description: 'Send tracking updates', enabled: notifications.trackingUpdated, recipient: 'customer' },
      ],
    },
    {
      id: 'customers',
      title: 'Customer Notifications',
      description: 'Registration and engagement emails',
      icon: Users,
      iconColor: 'text-purple-500',
      notifications: [
        { id: 'newCustomer', name: 'New Customer (Admin)', description: 'Notify admin on new registration', enabled: notifications.newCustomer, recipient: 'admin' },
        { id: 'customerWelcome', name: 'Welcome Email', description: 'Send welcome email to new customers', enabled: notifications.customerWelcome, recipient: 'customer' },
        { id: 'abandonedCart', name: 'Abandoned Cart', description: 'Remind customers about abandoned carts', enabled: notifications.abandonedCart, recipient: 'customer' },
      ],
    },
    {
      id: 'reviews',
      title: 'Reviews & Feedback',
      description: 'Product review notifications',
      icon: Star,
      iconColor: 'text-yellow-500',
      notifications: [
        { id: 'newReview', name: 'New Review (Admin)', description: 'Notify admin on new reviews', enabled: notifications.newReview, recipient: 'admin' },
        { id: 'reviewApproved', name: 'Review Approved', description: 'Notify customer when review is approved', enabled: notifications.reviewApproved, recipient: 'customer' },
        { id: 'lowRatingAlert', name: 'Low Rating Alert', description: 'Alert admin on 1-2 star reviews', enabled: notifications.lowRatingAlert, recipient: 'admin' },
      ],
    },
    {
      id: 'inventory',
      title: 'Inventory Alerts',
      description: 'Stock level notifications',
      icon: Package,
      iconColor: 'text-orange-500',
      notifications: [
        { id: 'lowStockAlert', name: 'Low Stock Alert', description: 'Alert when stock falls below threshold', enabled: notifications.lowStockAlert, recipient: 'admin' },
        { id: 'outOfStock', name: 'Out of Stock', description: 'Notify when product is out of stock', enabled: notifications.outOfStock, recipient: 'admin' },
        { id: 'stockReplenished', name: 'Stock Replenished', description: 'Notify when stock is replenished', enabled: notifications.stockReplenished, recipient: 'admin' },
      ],
    },
    {
      id: 'reports',
      title: 'Admin Reports',
      description: 'Scheduled report emails',
      icon: TrendingDown,
      iconColor: 'text-cyan-500',
      notifications: [
        { id: 'dailySalesReport', name: 'Daily Sales Report', description: 'Send daily sales summary', enabled: notifications.dailySalesReport, recipient: 'admin' },
        { id: 'weeklySummary', name: 'Weekly Summary', description: 'Send weekly store summary', enabled: notifications.weeklySummary, recipient: 'admin' },
        { id: 'monthlyReport', name: 'Monthly Report', description: 'Send monthly analytics report', enabled: notifications.monthlyReport, recipient: 'admin' },
      ],
    },
  ];

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('key', 'all_email_notifications')
        .single();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          setNotifications(prev => ({
            ...prev,
            ...parsed,
          }));
        } catch {
          // Ignore parse errors
        }
      }
    } catch (error) {
      console.log('Email notification settings not found, using defaults');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (notificationId: string) => {
    setSaving(notificationId);
    try {
      const newSettings = { 
        ...notifications, 
        [notificationId]: !notifications[notificationId] 
      };

      const { error } = await supabase
        .from('store_settings')
        .upsert({
          key: 'all_email_notifications',
          setting_value: JSON.stringify(newSettings),
        } as any, { onConflict: 'key' });

      if (error) throw error;
      
      setNotifications(newSettings);
      toast.success(`${notifications[notificationId] ? 'Disabled' : 'Enabled'} notification`);
    } catch (error: any) {
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(null);
    }
  };

  const getRecipientBadge = (recipient: 'admin' | 'customer' | 'both') => {
    switch (recipient) {
      case 'admin':
        return <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Admin</Badge>;
      case 'customer':
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">Customer</Badge>;
      case 'both':
        return <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500 border-purple-500/20">Both</Badge>;
    }
  };

  const countEnabled = (categoryNotifications: EmailNotification[]) => {
    return categoryNotifications.filter(n => n.enabled).length;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(notifications).filter(Boolean).length}
              </p>
              <p className="text-xs text-muted-foreground">Enabled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Object.values(notifications).filter(v => !v).length}
              </p>
              <p className="text-xs text-muted-foreground">Disabled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {categories.reduce((acc, cat) => acc + cat.notifications.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Types</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notification Categories */}
      {categories.map((category) => {
        const Icon = category.icon;
        const enabledCount = countEnabled(category.notifications);
        
        return (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <Icon className={`h-5 w-5 ${category.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">
                  {enabledCount}/{category.notifications.length} enabled
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.notifications.map((notification, index) => (
                  <div key={notification.id}>
                    {index > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between py-2">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{notification.name}</p>
                          {getRecipientBadge(notification.recipient)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.description}
                        </p>
                      </div>
                      <Switch
                        checked={notifications[notification.id]}
                        onCheckedChange={() => toggleNotification(notification.id)}
                        disabled={saving === notification.id}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
