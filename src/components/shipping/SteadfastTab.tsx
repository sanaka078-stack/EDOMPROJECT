import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSteadfastCourier, SteadfastOrder } from "@/hooks/useSteadfastCourier";
import { useShipmentsData, Shipment } from "@/hooks/useShipmentsData";
import { Loader2, Package, RefreshCw, Search, Send, Wallet, Clock, Truck, CheckCircle, RotateCcw } from "lucide-react";

interface SteadfastTabProps {
  pendingOrders: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  picked_up: { label: "Picked Up", color: "bg-blue-100 text-blue-800", icon: Package },
  in_transit: { label: "In Transit", color: "bg-purple-100 text-purple-800", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: RotateCcw },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: Package },
};

export const SteadfastTab = forwardRef<HTMLDivElement, SteadfastTabProps>(function SteadfastTab({ pendingOrders }, ref) {
  const steadfast = useSteadfastCourier();
  const { shipments, loading: shipmentsLoading, addShipment, updateShipmentStatus, getShipmentsByCourier, refetch } = useShipmentsData();
  
  const [trackingCodeSearch, setTrackingCodeSearch] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const steadfastShipments = getShipmentsByCourier('steadfast');

  useEffect(() => {
    steadfast.getBalance().catch(() => {});
  }, []);

  const handleTrack = async () => {
    if (!trackingCodeSearch.trim()) {
      toast.error('Please enter a tracking code');
      return;
    }
    try {
      const result = await steadfast.checkStatusByTracking(trackingCodeSearch);
      setTrackingResult(result);
      
      // Update local shipment status if found
      const shipment = steadfastShipments.find(s => s.tracking_number === trackingCodeSearch);
      if (shipment && result.delivery_status) {
        const statusMap: Record<string, string> = {
          'pending': 'pending',
          'delivered_approval_pending': 'delivered',
          'partial_delivered_approval_pending': 'delivered',
          'cancelled_approval_pending': 'cancelled',
          'unknown_approval_pending': 'pending',
          'delivered': 'delivered',
          'partial_delivered': 'delivered',
          'cancelled': 'cancelled',
          'hold': 'in_transit',
          'in_review': 'in_transit',
        };
        const mappedStatus = statusMap[result.delivery_status] || 'in_transit';
        await updateShipmentStatus(shipment.id, mappedStatus, result.delivery_status);
      }
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  const handleSendToSteadfast = async () => {
    if (!selectedOrder) return;

    try {
      const shippingAddress = typeof selectedOrder.shipping_address === 'string' 
        ? selectedOrder.shipping_address 
        : `${selectedOrder.shipping_address?.street || ''}, ${selectedOrder.shipping_address?.city || ''}`;
      
      const steadfastOrder: SteadfastOrder = {
        invoice: selectedOrder.order_number,
        recipient_name: selectedOrder.customer_name,
        recipient_phone: selectedOrder.customer_phone,
        recipient_address: shippingAddress,
        cod_amount: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
        note: selectedOrder.notes || '',
        item_description: selectedOrder.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'Products',
      };

      const result = await steadfast.createOrder(steadfastOrder);
      
      if (result.consignment) {
        // Save to shipments table
        await addShipment({
          order_id: selectedOrder.id,
          courier: 'steadfast',
          consignment_id: result.consignment.consignment_id?.toString(),
          tracking_number: result.consignment.tracking_code,
          status: 'pending',
          courier_response: {
            status: result.consignment.status,
            recipient_name: selectedOrder.customer_name,
            recipient_phone: selectedOrder.customer_phone,
            recipient_address: shippingAddress,
            cod_amount: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
          },
        });

        toast.success(`Sent to Steadfast. Tracking code: ${result.consignment.tracking_code}`);
        setSendDialogOpen(false);
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Error sending to Steadfast:', error);
    }
  };

  const openSendDialog = (order: any) => {
    // Check if already sent
    const existingShipment = steadfastShipments.find(s => s.order_id === order.id);
    if (existingShipment) {
      toast.error(`This order has already been sent. Tracking: ${existingShipment.tracking_number}`);
      return;
    }
    setSelectedOrder(order);
    setSendDialogOpen(true);
  };

  const refreshAllStatuses = async () => {
    for (const shipment of steadfastShipments.filter(s => s.status !== 'delivered' && s.status !== 'cancelled')) {
      if (shipment.tracking_number) {
        try {
          const result = await steadfast.checkStatusByTracking(shipment.tracking_number);
          if (result.delivery_status) {
            const statusMap: Record<string, string> = {
              'pending': 'pending',
              'delivered_approval_pending': 'delivered',
              'delivered': 'delivered',
              'cancelled': 'cancelled',
              'hold': 'in_transit',
            };
            const mappedStatus = statusMap[result.delivery_status] || 'in_transit';
            await updateShipmentStatus(shipment.id, mappedStatus, result.delivery_status);
          }
        } catch (error) {
          console.error(`Error updating status for ${shipment.tracking_number}:`, error);
        }
      }
    }
    toast.success('All statuses updated');
    refetch();
  };

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Steadfast Courier
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Wallet className="h-4 w-4 mr-1" />
            ৳{steadfast.balance?.toLocaleString() || 0}
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => steadfast.getBalance()}
            disabled={steadfast.loading}
          >
            {steadfast.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Track */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Quick Tracking
            </CardTitle>
            <CardDescription>Search order by tracking code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Tracking code (e.g. 15BAEB8A)"
                value={trackingCodeSearch}
                onChange={(e) => setTrackingCodeSearch(e.target.value)}
              />
              <Button onClick={handleTrack} disabled={steadfast.loading}>
                {steadfast.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {trackingResult && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{trackingResult.delivery_status || 'Unknown'}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Orders to Ship */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-5 w-5" />
              Pending for Shipping
            </CardTitle>
            <CardDescription>{pendingOrders.length} orders waiting to be shipped</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending orders</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingOrders.slice(0, 5).map((order) => {
                  const alreadySent = steadfastShipments.some(s => s.order_number === order.order_number);
                  return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                      </div>
                      {alreadySent ? (
                        <Badge variant="secondary">Sent</Badge>
                      ) : (
                        <Button size="sm" onClick={() => openSendDialog(order)}>
                          <Send className="h-3 w-3 mr-1" />
                          Send
                        </Button>
                      )}
                    </div>
                  );
                })}
                {pendingOrders.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{pendingOrders.length - 5} more orders
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shipment History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Shipment History</CardTitle>
              <CardDescription>All orders sent to Steadfast</CardDescription>
            </div>
            <Button variant="outline" onClick={refreshAllStatuses} disabled={steadfast.loading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update All Statuses
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tracking Code</TableHead>
                <TableHead>Order Number</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>COD</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steadfastShipments.map((shipment) => {
                const status = statusConfig[shipment.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono text-sm">{shipment.tracking_number || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{shipment.order_number || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{shipment.recipient_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{shipment.recipient_phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>৳{(shipment.cod_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(shipment.sent_at || shipment.created_at).toLocaleDateString('en-US')}
                    </TableCell>
                  </TableRow>
                );
              })}
              {steadfastShipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {shipmentsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : (
                      'No shipments found'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* All Pending Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Pending Orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingOrders.map((order) => {
                const alreadySent = steadfastShipments.some(s => s.order_id === order.id);
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell>{order.customer_phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {typeof order.shipping_address === 'string' 
                        ? order.shipping_address 
                        : `${order.shipping_address?.street || ''}, ${order.shipping_address?.city || ''}`}
                    </TableCell>
                    <TableCell>৳{order.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment_method === 'cod' ? 'outline' : 'default'}>
                        {order.payment_method === 'cod' ? 'COD' : 'Paid'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {alreadySent ? (
                        <Badge variant="secondary">Sent</Badge>
                      ) : (
                        <Button size="sm" onClick={() => openSendDialog(order)}>
                          <Send className="h-3 w-3 mr-1" />
                          Send to Steadfast
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {pendingOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No pending orders
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Send to Steadfast Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Send to Steadfast
            </DialogTitle>
            <DialogDescription>
              Order: {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-mono font-medium">{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span>{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{selectedOrder.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="text-right max-w-[200px]">
                    {typeof selectedOrder.shipping_address === 'string' 
                      ? selectedOrder.shipping_address 
                      : `${selectedOrder.shipping_address?.street || ''}, ${selectedOrder.shipping_address?.city || ''}`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">COD Amount:</span>
                  <span className="font-bold">
                    {selectedOrder.payment_method === 'cod' 
                      ? `৳${selectedOrder.total.toLocaleString()}` 
                      : '৳0 (Prepaid)'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">You will receive a tracking code after the order is sent</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSendToSteadfast} disabled={steadfast.loading}>
              {steadfast.loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Steadfast
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
