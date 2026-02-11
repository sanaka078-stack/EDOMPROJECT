import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Eye, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import type { RecentOrder } from "@/hooks/useDashboardData";

interface RecentOrdersProps {
  orders?: RecentOrder[];
  loading?: boolean;
}

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  processing: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function RecentOrders({ orders = [], loading = false }: RecentOrdersProps) {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-card shadow-card animate-fade-in">
        <div className="flex items-center justify-between border-b border-border p-4 sm:p-6">
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card shadow-card animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border p-4 sm:p-6">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">Recent Orders</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">Latest customer orders</p>
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => navigate('/admin/orders')}>
          View All
        </Button>
      </div>
      
      {orders.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No orders yet
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-border">
            {orders.map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{order.order_number}</span>
                  <Badge variant="outline" className={statusStyles[order.status] || statusStyles.pending}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {order.customer_name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{order.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{order.payment_status}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">{formatCurrency(order.total)}</span>
                  <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order ID</th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 lg:px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-muted/50">
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4">
                      <span className="font-medium text-foreground">{order.order_number}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {order.customer_name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.payment_status}</p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4 font-semibold text-foreground">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4">
                      <Badge variant="outline" className={statusStyles[order.status] || statusStyles.pending}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-muted-foreground hidden lg:table-cell">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 lg:px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/orders?view=${order.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/orders?edit=${order.id}`)}>
                            <RefreshCw className="mr-2 h-4 w-4" /> Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              navigate(`/admin/orders?cancel=${order.id}`);
                              toast.info(`Navigating to cancel order ${order.order_number}`);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
