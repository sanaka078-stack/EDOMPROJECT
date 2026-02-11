import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ShoppingBag,
  MoreVertical,
  Send,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AbandonedCart } from "@/hooks/useAbandonedCartsData";

interface AbandonedCartTableProps {
  carts: AbandonedCart[];
  isLoading: boolean;
  onRefresh?: () => void;
}

export function AbandonedCartTable({ carts, isLoading, onRefresh }: AbandonedCartTableProps) {
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const { toast } = useToast();

  const sendManualReminder = async (cart: AbandonedCart, reminderType: 'first' | 'second' | 'final') => {
    if (!cart.customer_email) {
      toast({
        title: "Cannot send reminder",
        description: "This customer has no email address.",
        variant: "destructive",
      });
      return;
    }

    setSendingReminder(cart.id);
    try {
      const { data, error } = await supabase.functions.invoke('send-abandoned-cart-reminder', {
        body: {
          customerEmail: cart.customer_email,
          customerName: cart.customer_name || 'Valued Customer',
          cartItems: cart.cart_items,
          cartTotal: cart.cart_total,
          cartUrl: `${window.location.origin}/store/cart`,
          reminderType,
        },
      });

      if (error) throw error;

      // Update reminder count in database
      const updateData: Record<string, any> = {
        reminder_sent_count: cart.reminder_sent_count + 1,
      };
      
      if (reminderType === 'first') {
        updateData.first_reminder_sent_at = new Date().toISOString();
      } else if (reminderType === 'second') {
        updateData.second_reminder_sent_at = new Date().toISOString();
      } else {
        updateData.final_reminder_sent_at = new Date().toISOString();
      }

      await supabase
        .from('abandoned_carts')
        .update(updateData)
        .eq('id', cart.id);

      toast({
        title: "Reminder sent!",
        description: `${reminderType === 'final' ? 'Final reminder with discount' : 'Reminder'} email sent to ${cart.customer_email}`,
      });

      onRefresh?.();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Failed to send reminder",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const getStatusBadge = (cart: AbandonedCart) => {
    if (cart.recovered_at) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="mr-1 h-3 w-3" />
          Recovered
        </Badge>
      );
    }
    if (cart.abandoned_at) {
      if (cart.reminder_sent_count >= 3) {
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Final Reminder Sent
          </Badge>
        );
      }
      if (cart.reminder_sent_count > 0) {
        return (
          <Badge variant="secondary">
            <Mail className="mr-1 h-3 w-3" />
            {cart.reminder_sent_count} Reminder(s) Sent
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
          <Clock className="mr-1 h-3 w-3" />
          Abandoned
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <ShoppingBag className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No abandoned carts yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          When customers leave items in their cart without completing checkout, they'll appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Cart Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Abandoned</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {carts.map((cart) => (
              <TableRow key={cart.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {cart.customer_name || cart.customer_email || "Anonymous"}
                    </p>
                    {cart.customer_email && cart.customer_name && (
                      <p className="text-sm text-muted-foreground">{cart.customer_email}</p>
                    )}
                    {!cart.customer_email && !cart.customer_name && (
                      <p className="text-xs text-muted-foreground">
                        Session: {cart.session_id.slice(0, 8)}...
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{cart.cart_items.length}</span>
                  <span className="text-muted-foreground ml-1">items</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-foreground">
                    ৳{cart.cart_total.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(cart)}</TableCell>
                <TableCell>
                  {cart.abandoned_at ? (
                    <div>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(cart.abandoned_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(cart.abandoned_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCart(cart)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {/* Send Reminder Dropdown */}
                    {cart.customer_email && !cart.recovered_at && cart.abandoned_at && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            disabled={sendingReminder === cart.id}
                          >
                            {sendingReminder === cart.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => sendManualReminder(cart, 'first')}
                            disabled={sendingReminder === cart.id}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send 1st Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => sendManualReminder(cart, 'second')}
                            disabled={sendingReminder === cart.id}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send 2nd Reminder
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => sendManualReminder(cart, 'final')}
                            disabled={sendingReminder === cart.id}
                          >
                            <Mail className="mr-2 h-4 w-4 text-primary" />
                            Send Final (with 10% off)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Cart Details Modal */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
            <DialogDescription>
              {selectedCart?.customer_name || selectedCart?.customer_email || "Anonymous customer"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCart && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedCart.customer_email || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono text-sm">{selectedCart.session_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(selectedCart.created_at), "PPpp")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="font-medium">
                    {format(new Date(selectedCart.last_activity_at), "PPpp")}
                  </p>
                </div>
              </div>

              {/* Cart Items */}
              <div>
                <h4 className="font-semibold mb-3">Cart Items</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {selectedCart.cart_items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 border border-border rounded-lg"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × ৳{item.price?.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-bold">
                          ৳{((item.quantity || 1) * (item.price || 0)).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Summary */}
              <div className="flex justify-between items-center p-4 bg-primary/5 rounded-lg">
                <span className="font-semibold">Total Cart Value</span>
                <span className="text-xl font-bold text-primary">
                  ৳{selectedCart.cart_total.toLocaleString()}
                </span>
              </div>

              {/* Reminder History */}
              {selectedCart.reminder_sent_count > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Reminder History</h4>
                  <div className="space-y-2">
                    {selectedCart.first_reminder_sent_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>1st reminder sent:</span>
                        <span className="text-muted-foreground">
                          {format(new Date(selectedCart.first_reminder_sent_at), "PPpp")}
                        </span>
                      </div>
                    )}
                    {selectedCart.second_reminder_sent_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>2nd reminder sent:</span>
                        <span className="text-muted-foreground">
                          {format(new Date(selectedCart.second_reminder_sent_at), "PPpp")}
                        </span>
                      </div>
                    )}
                    {selectedCart.final_reminder_sent_at && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>Final reminder sent:</span>
                        <span className="text-muted-foreground">
                          {format(new Date(selectedCart.final_reminder_sent_at), "PPpp")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recovery Status */}
              {selectedCart.recovered_at && (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg text-success">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Recovered on {format(new Date(selectedCart.recovered_at), "PPpp")}
                  </span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
