import { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  MessageSquare, 
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "order" | "customer" | "product" | "message" | "payment" | "shipping";
  title: string;
  description: string;
  timestamp: Date;
  status?: "success" | "warning" | "error" | "info";
}

const activityIcons = {
  order: ShoppingCart,
  customer: Users,
  product: Package,
  message: MessageSquare,
  payment: CreditCard,
  shipping: Truck,
};

const statusStyles = {
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  error: "text-destructive bg-destructive/10",
  info: "text-primary bg-primary/10",
};

interface ActivityFeedProps {
  limit?: number;
  className?: string;
}

export function ActivityFeed({ limit = 10, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    try {
      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, created_at, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Fetch recent contact messages
      const { data: messages } = await supabase
        .from('contact_messages')
        .select('id, name, subject, created_at, status')
        .order('created_at', { ascending: false })
        .limit(3);

      const activityItems: ActivityItem[] = [];

      // Map orders to activities
      (orders || []).forEach((order: any) => {
        let status: ActivityItem["status"] = "info";
        let description = `Order #${order.order_number}`;

        if (order.status === "delivered") {
          status = "success";
          description += " was delivered";
        } else if (order.status === "cancelled") {
          status = "error";
          description += " was cancelled";
        } else if (order.status === "processing") {
          status = "info";
          description += " is being processed";
        } else if (order.status === "shipped") {
          status = "info";
          description += " has been shipped";
        } else {
          description += ` placed - ৳${Number(order.total_amount).toLocaleString()}`;
        }

        activityItems.push({
          id: `order-${order.id}`,
          type: "order",
          title: "New Order",
          description,
          timestamp: new Date(order.created_at),
          status,
        });
      });

      // Map customers to activities
      (customers || []).forEach((customer: any) => {
        activityItems.push({
          id: `customer-${customer.id}`,
          type: "customer",
          title: "New Customer",
          description: `${customer.full_name} registered`,
          timestamp: new Date(customer.created_at),
          status: "success",
        });
      });

      // Map messages to activities
      (messages || []).forEach((message: any) => {
        activityItems.push({
          id: `message-${message.id}`,
          type: "message",
          title: "Contact Message",
          description: `${message.name}: ${message.subject || "New inquiry"}`,
          timestamp: new Date(message.created_at),
          status: message.status === "replied" ? "success" : "warning",
        });
      });

      // Sort by timestamp
      activityItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setActivities(activityItems.slice(0, limit));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime changes
    const ordersChannel = supabase
      .channel('activity-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchActivities)
      .subscribe();

    const customersChannel = supabase
      .channel('activity-customers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchActivities)
      .subscribe();

    const messagesChannel = supabase
      .channel('activity-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchActivities)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(customersChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [limit]);

  if (loading) {
    return (
      <div className={cn("rounded-xl bg-card p-4 sm:p-6 shadow-card", className)}>
        <div className="mb-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl bg-card p-4 sm:p-6 shadow-card", className)}>
      <div className="mb-4">
        <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">
          Activity Feed
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Recent store activity</p>
      </div>

      <ScrollArea className="h-[300px] pr-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type];
              return (
                <div key={activity.id} className="flex gap-3 group">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    statusStyles[activity.status || "info"]
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
