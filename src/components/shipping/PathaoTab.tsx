import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePathaoCourier, PathaoOrder, PathaoCity, PathaoZone, PathaoArea, PathaoStore } from "@/hooks/usePathaoCourier";
import { useShipmentsData } from "@/hooks/useShipmentsData";
import { Loader2, Package, RefreshCw, Search, Send, MapPin, Truck, Clock, CheckCircle, RotateCcw } from "lucide-react";

interface PathaoTabProps {
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

export const PathaoTab = forwardRef<HTMLDivElement, PathaoTabProps>(function PathaoTab({ pendingOrders }, ref) {
  const pathao = usePathaoCourier();
  const { shipments, loading: shipmentsLoading, addShipment, updateShipmentStatus, getShipmentsByCourier, refetch } = useShipmentsData();
  
  const [consignmentSearch, setConsignmentSearch] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Pathao location data
  const [stores, setStores] = useState<PathaoStore[]>([]);
  const [cities, setCities] = useState<PathaoCity[]>([]);
  const [zones, setZones] = useState<PathaoZone[]>([]);
  const [areas, setAreas] = useState<PathaoArea[]>([]);
  
  // Selected location values
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [deliveryType, setDeliveryType] = useState<string>("48");
  
  // Price calculation
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  
  // Connection status
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const pathaoShipments = getShipmentsByCourier('pathao');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const result = await pathao.testConnection();
      if (result?.code === 200) {
        setConnectionStatus('connected');
        loadInitialData();
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const loadInitialData = async () => {
    try {
      const [storesData, citiesData] = await Promise.all([
        pathao.getStores(),
        pathao.getCities()
      ]);
      setStores(storesData);
      setCities(citiesData);
    } catch (error) {
      console.error('Error loading Pathao data:', error);
    }
  };

  const handleCityChange = async (cityId: string) => {
    setSelectedCity(cityId);
    setSelectedZone("");
    setSelectedArea("");
    setZones([]);
    setAreas([]);
    
    if (cityId) {
      try {
        const zonesData = await pathao.getZones(parseInt(cityId));
        setZones(zonesData);
      } catch (error) {
        console.error('Error loading zones:', error);
      }
    }
  };

  const handleZoneChange = async (zoneId: string) => {
    setSelectedZone(zoneId);
    setSelectedArea("");
    setAreas([]);
    
    if (zoneId) {
      try {
        const areasData = await pathao.getAreas(parseInt(zoneId));
        setAreas(areasData);
      } catch (error) {
        console.error('Error loading areas:', error);
      }
    }
  };

  const handleCalculatePrice = async () => {
    if (!selectedCity || !selectedZone) {
      toast.error('Please select city and zone');
      return;
    }
    
    setPriceLoading(true);
    try {
      const result = await pathao.calculatePrice({
        store_id: selectedStore ? parseInt(selectedStore) : undefined,
        item_type: 2, // Parcel
        delivery_type: parseInt(deliveryType),
        item_weight: 0.5,
        recipient_city: parseInt(selectedCity),
        recipient_zone: parseInt(selectedZone),
      });
      
      if (result?.data?.price) {
        setCalculatedPrice(result.data.price);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleTrack = async () => {
    if (!consignmentSearch.trim()) {
      toast.error('Please enter a consignment ID');
      return;
    }
    
    try {
      const result = await pathao.getOrderInfo(consignmentSearch);
      setTrackingResult(result?.data);
    } catch (error) {
      console.error('Tracking error:', error);
    }
  };

  const handleSendToPathao = async () => {
    if (!selectedOrder || !selectedCity || !selectedZone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const shippingAddress = typeof selectedOrder.shipping_address === 'string' 
        ? selectedOrder.shipping_address 
        : `${selectedOrder.shipping_address?.street || ''}, ${selectedOrder.shipping_address?.city || ''}`;
      
      const pathaoOrder: PathaoOrder = {
        store_id: selectedStore ? parseInt(selectedStore) : undefined,
        merchant_order_id: selectedOrder.order_number,
        recipient_name: selectedOrder.customer_name,
        recipient_phone: selectedOrder.customer_phone,
        recipient_address: shippingAddress,
        recipient_city: parseInt(selectedCity),
        recipient_zone: parseInt(selectedZone),
        recipient_area: selectedArea ? parseInt(selectedArea) : undefined,
        delivery_type: parseInt(deliveryType),
        item_type: 2, // Parcel
        item_quantity: selectedOrder.items?.length || 1,
        item_weight: 0.5,
        item_description: selectedOrder.items?.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ') || 'Products',
        amount_to_collect: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
        special_instruction: selectedOrder.notes || '',
      } as any;

      const result = await pathao.createOrder(pathaoOrder);
      
      if (result?.code === 200) {
        // Save to shipments table
        await addShipment({
          order_id: selectedOrder.id,
          courier: 'pathao',
          consignment_id: result.data?.consignment_id?.toString(),
          tracking_number: result.data?.consignment_id?.toString(),
          status: 'pending',
          courier_response: {
            order_status: result.data?.order_status,
            recipient_name: selectedOrder.customer_name,
            recipient_phone: selectedOrder.customer_phone,
            recipient_address: shippingAddress,
            cod_amount: selectedOrder.payment_method === 'cod' ? selectedOrder.total : 0,
            delivery_charge: calculatedPrice,
          },
        });

        toast.success(`Sent to Pathao. Consignment ID: ${result.data?.consignment_id}`);
        setSendDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error sending to Pathao:', error);
    }
  };

  const openSendDialog = (order: any) => {
    // Check if already sent
    const existingShipment = pathaoShipments.find(s => s.order_id === order.id);
    if (existingShipment) {
      toast.error(`This order has already been sent. Consignment: ${existingShipment.consignment_id}`);
      return;
    }
    setSelectedOrder(order);
    setSendDialogOpen(true);
  };

  const resetForm = () => {
    setSelectedOrder(null);
    setSelectedStore("");
    setSelectedCity("");
    setSelectedZone("");
    setSelectedArea("");
    setDeliveryType("48");
    setCalculatedPrice(null);
    setZones([]);
    setAreas([]);
  };

  if (connectionStatus === 'error') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">Pathao Not Connected</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure Pathao in Settings &gt; Integrations
          </p>
          <Button variant="outline" onClick={checkConnection}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Pathao Courier
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
            {connectionStatus === 'connected' ? '✓ Connected' : 'Checking...'}
          </Badge>
          <Button 
            variant="outline" 
            onClick={checkConnection}
            disabled={pathao.loading}
          >
            {pathao.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
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
            <CardDescription>Search order by consignment ID</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Consignment ID (e.g. DM2401123456)"
                value={consignmentSearch}
                onChange={(e) => setConsignmentSearch(e.target.value)}
              />
              <Button onClick={handleTrack} disabled={pathao.loading}>
                {pathao.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {trackingResult && (
              <div className="p-4 rounded-lg bg-muted space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{trackingResult.order_status || 'Unknown'}</Badge>
                </div>
                {trackingResult.consignment_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Consignment:</span>
                    <span className="font-mono text-sm">{trackingResult.consignment_id}</span>
                  </div>
                )}
                {trackingResult.recipient_name && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Recipient:</span>
                    <span className="text-sm">{trackingResult.recipient_name}</span>
                  </div>
                )}
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
                  const alreadySent = pathaoShipments.some(s => s.order_id === order.id);
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
              <CardDescription>All orders sent to Pathao</CardDescription>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={shipmentsLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Consignment</TableHead>
                <TableHead>Order Number</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>COD</TableHead>
                <TableHead>Delivery Charge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pathaoShipments.map((shipment) => {
                const status = statusConfig[shipment.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                return (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-mono text-sm">{shipment.consignment_id || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{shipment.order_number || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{shipment.recipient_name || '-'}</p>
                        <p className="text-xs text-muted-foreground">{shipment.recipient_phone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>৳{(shipment.cod_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{shipment.delivery_charge ? `৳${shipment.delivery_charge}` : '-'}</TableCell>
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
              {pathaoShipments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      const alreadySent = pathaoShipments.some(s => s.order_id === order.id);
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
                          Send to Pathao
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

      {/* Send to Pathao Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={(open) => {
        setSendDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Send to Pathao
            </DialogTitle>
            <DialogDescription>
              Order: {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Store Selection */}
            <div className="space-y-2">
              <Label>Pickup Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.store_id} value={store.store_id.toString()}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Type */}
            <div className="space-y-2">
              <Label>Delivery Type</Label>
              <Select value={deliveryType} onValueChange={setDeliveryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="48">Normal Delivery (48 Hours)</SelectItem>
                  <SelectItem value="12">On Demand (12 Hours)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Selection */}
            <div className="space-y-2">
              <Label>City *</Label>
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.city_id} value={city.city_id.toString()}>
                      {city.city_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zone Selection */}
            <div className="space-y-2">
              <Label>Zone *</Label>
              <Select value={selectedZone} onValueChange={handleZoneChange} disabled={!selectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.zone_id} value={zone.zone_id.toString()}>
                      {zone.zone_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area Selection */}
            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={selectedArea} onValueChange={setSelectedArea} disabled={!selectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.area_id} value={area.area_id.toString()}>
                      {area.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Calculation */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={handleCalculatePrice}
                disabled={priceLoading || !selectedCity || !selectedZone}
              >
                {priceLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                Calculate Price
              </Button>
              {calculatedPrice !== null && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  ৳{calculatedPrice}
                </Badge>
              )}
            </div>

            {/* Order Summary */}
            <div className="p-3 rounded-lg bg-muted space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipient:</span>
                <span>{selectedOrder?.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Phone:</span>
                <span>{selectedOrder?.customer_phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">COD:</span>
                <span>৳{selectedOrder?.payment_method === 'cod' ? selectedOrder?.total?.toLocaleString() : 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendToPathao} disabled={pathao.loading || !selectedCity || !selectedZone}>
              {pathao.loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send to Pathao
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
