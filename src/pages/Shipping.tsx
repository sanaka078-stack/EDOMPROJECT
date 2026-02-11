import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useOrdersData } from "@/hooks/useOrdersData";
import { useShippingData } from "@/hooks/useShippingData";
import { useShipmentsData } from "@/hooks/useShipmentsData";
import { SteadfastTab } from "@/components/shipping/SteadfastTab";
import { PathaoTab } from "@/components/shipping/PathaoTab";
import { Loader2 } from "lucide-react";
import { 
  MapPin, 
  Truck, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Globe,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface Courier {
  id: string;
  name: string;
  logo: string;
  apiKey: string;
  isActive: boolean;
  trackingUrl: string;
}

const initialCouriers: Courier[] = [
  {
    id: "courier-1",
    name: "Steadfast",
    logo: "📦",
    apiKey: "configured",
    isActive: true,
    trackingUrl: "https://portal.packzy.com",
  },
  {
    id: "courier-2",
    name: "Pathao",
    logo: "🚴",
    apiKey: "configured",
    isActive: true,
    trackingUrl: "https://merchant.pathao.com",
  },
  {
    id: "courier-3",
    name: "Paperfly",
    logo: "✈️",
    apiKey: "",
    isActive: false,
    trackingUrl: "https://paperfly.com.bd/track/",
  },
  {
    id: "courier-4",
    name: "RedX",
    logo: "🔴",
    apiKey: "",
    isActive: false,
    trackingUrl: "https://redx.com.bd/track/",
  }
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  picked_up: { label: "Picked Up", color: "bg-blue-100 text-blue-800", icon: Package },
  in_transit: { label: "In Transit", color: "bg-purple-100 text-purple-800", icon: Truck },
  out_for_delivery: { label: "Out for Delivery", color: "bg-indigo-100 text-indigo-800", icon: Navigation },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: CheckCircle },
  returned: { label: "Returned", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function Shipping() {
  // Database hooks
  const shippingData = useShippingData();
  const { zonesWithRates, loading: shippingLoading, addZone, toggleZone, deleteZone, addRate, updateRate, deleteRate, toggleRate } = shippingData;
  const { shipments, stats: shipmentStats, loading: shipmentsLoading } = useShipmentsData();
  
  const [couriers, setCouriers] = useState<Courier[]>(initialCouriers);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editRateDialogOpen, setEditRateDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<{ id: string; name: string } | null>(null);
  const [trackingSearch, setTrackingSearch] = useState("");

  const [newZone, setNewZone] = useState({ name: "", regions: "" });
  const [newRate, setNewRate] = useState({
    name: "",
    rate: 0,
    min_weight: null as number | null,
    max_weight: null as number | null,
    min_order_amount: null as number | null,
    max_order_amount: null as number | null,
    min_days: 1,
    max_days: 3,
  });
  const [editingRate, setEditingRate] = useState<{
    id: string;
    name: string;
    rate: number;
    min_weight: number | null;
    max_weight: number | null;
    min_order_amount: number | null;
    max_order_amount: number | null;
    min_days: number;
    max_days: number;
    is_active: boolean;
  } | null>(null);

  const { orders } = useOrdersData();

  // Filter pending orders for shipping
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');

  const stats = {
    totalZones: zonesWithRates.length,
    activeZones: zonesWithRates.filter(z => z.is_active).length,
    activeCouriers: couriers.filter(c => c.isActive).length,
    ...shipmentStats,
  };

  const handleAddZone = async () => {
    if (!newZone.name || !newZone.regions) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await addZone(newZone.name, newZone.regions.split(",").map(r => r.trim()));
      setNewZone({ name: "", regions: "" });
      setZoneDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleAddRate = async () => {
    if (!selectedZone || !newRate.name || !newRate.rate) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await addRate({
        zone_id: selectedZone.id,
        name: newRate.name,
        rate: newRate.rate,
        min_weight: newRate.min_weight,
        max_weight: newRate.max_weight,
        min_order_amount: newRate.min_order_amount,
        max_order_amount: newRate.max_order_amount,
        min_days: newRate.min_days,
        max_days: newRate.max_days,
        is_active: true
      });
      setNewRate({ name: "", rate: 0, min_weight: null, max_weight: null, min_order_amount: null, max_order_amount: null, min_days: 1, max_days: 3 });
      setRateDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleEditRate = async () => {
    if (!editingRate) return;
    
    try {
      await updateRate(editingRate.id, {
        name: editingRate.name,
        rate: editingRate.rate,
        min_weight: editingRate.min_weight,
        max_weight: editingRate.max_weight,
        min_order_amount: editingRate.min_order_amount,
        max_order_amount: editingRate.max_order_amount,
        min_days: editingRate.min_days,
        max_days: editingRate.max_days,
      });
      setEditingRate(null);
      setEditRateDialogOpen(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const openEditRateDialog = (rate: any) => {
    setEditingRate({
      id: rate.id,
      name: rate.name,
      rate: rate.rate,
      min_weight: rate.min_weight,
      max_weight: rate.max_weight,
      min_order_amount: rate.min_order_amount,
      max_order_amount: rate.max_order_amount,
      min_days: rate.min_days ?? 1,
      max_days: rate.max_days ?? 3,
      is_active: rate.is_active,
    });
    setEditRateDialogOpen(true);
  };

  const toggleCourier = (courierId: string) => {
    setCouriers(couriers.map(c => 
      c.id === courierId ? { ...c, isActive: !c.isActive } : c
    ));
    toast.success("Courier status updated");
  };

  const filteredShipments = shipments.filter(s => 
    s.tracking_number?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    s.order_number?.toLowerCase().includes(trackingSearch.toLowerCase()) ||
    s.recipient_name?.toLowerCase().includes(trackingSearch.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shipping Management</h1>
          <p className="text-muted-foreground">Manage shipping zones, rates and courier integrations</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Zones</p>
                  <p className="text-2xl font-bold">{stats.totalZones}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Shipments</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">In Transit</p>
                  <p className="text-2xl font-bold">{stats.inTransit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-2xl font-bold">{stats.delivered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Returned</p>
                  <p className="text-2xl font-bold">{stats.returned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="steadfast" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="steadfast">📦 Steadfast</TabsTrigger>
            <TabsTrigger value="pathao">🚴 Pathao</TabsTrigger>
            <TabsTrigger value="zones">Shipping Zones</TabsTrigger>
            <TabsTrigger value="rates">Rate Config</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          {/* Steadfast Tab */}
          <TabsContent value="steadfast" className="space-y-4">
            <SteadfastTab pendingOrders={pendingOrders} />
          </TabsContent>

          {/* Pathao Tab */}
          <TabsContent value="pathao" className="space-y-4">
            <PathaoTab pendingOrders={pendingOrders} />
          </TabsContent>

          {/* Shipping Zones Tab */}
          <TabsContent value="zones" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Shipping Zones</h2>
              <Button onClick={() => setZoneDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Zone
              </Button>
            </div>

            {shippingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {zonesWithRates.map((zone) => (
                  <Card key={zone.id} className={!zone.is_active ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{zone.name}</CardTitle>
                        <Switch 
                          checked={zone.is_active} 
                          onCheckedChange={() => toggleZone(zone.id)}
                        />
                      </div>
                      <CardDescription>
                        {zone.regions.join(", ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Shipping Rates ({zone.rates?.length || 0})</p>
                        {zone.rates?.slice(0, 2).map((rate) => (
                          <div key={rate.id} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{rate.name}</span>
                            <span>৳{rate.rate}</span>
                          </div>
                        ))}
                        {(zone.rates?.length || 0) > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{(zone.rates?.length || 0) - 2} more rates
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedZone({ id: zone.id, name: zone.name });
                            setRateDialogOpen(true);
                          }}
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Add Rate
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteZone(zone.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rates Configuration Tab */}
          <TabsContent value="rates" className="space-y-4">
            <h2 className="text-xl font-semibold">Rate Configuration</h2>
            
            {shippingLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              zonesWithRates.map((zone) => (
                <Card key={zone.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{zone.name}</CardTitle>
                      <Badge variant={zone.is_active ? "default" : "secondary"}>
                        {zone.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rate Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Weight Range</TableHead>
                          <TableHead>Delivery Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zone.rates?.map((rate) => (
                          <TableRow key={rate.id}>
                            <TableCell className="font-medium">{rate.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {rate.min_weight || rate.max_weight ? 'Weight Based' : 
                                 rate.min_order_amount || rate.max_order_amount ? 'Order Based' : 'Flat Rate'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              ৳{rate.rate}
                              {rate.min_order_amount && <span className="text-xs text-muted-foreground"> (Min: ৳{rate.min_order_amount})</span>}
                              {rate.max_order_amount && <span className="text-xs text-green-600"> (Free above ৳{rate.max_order_amount})</span>}
                            </TableCell>
                            <TableCell>
                              {rate.min_weight ? `${rate.min_weight}kg` : '0'}-{rate.max_weight ? `${rate.max_weight}kg` : '∞'}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {rate.min_days ?? 1}-{rate.max_days ?? 3} days
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={rate.is_active ? "default" : "secondary"}>
                                {rate.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" onClick={() => openEditRateDialog(rate)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteRate(rate.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!zone.rates || zone.rates.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                              No rates configured
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* All Shipments Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">All Shipment Tracking</h2>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search tracking code or order number..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Courier</TableHead>
                      <TableHead>Tracking Code</TableHead>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>COD</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredShipments.map((shipment) => {
                      const status = statusConfig[shipment.status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      return (
                        <TableRow key={shipment.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {shipment.courier === 'steadfast' ? '📦 Steadfast' : '🚴 Pathao'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{shipment.tracking_number || shipment.consignment_id || '-'}</TableCell>
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
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild>
                              <a 
                                href={shipment.courier === 'steadfast' 
                                  ? `https://portal.packzy.com` 
                                  : `https://merchant.pathao.com`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Track
                              </a>
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredShipments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Shipping Zone</DialogTitle>
            <DialogDescription>
              Create a new shipping zone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Zone Name</Label>
              <Input 
                placeholder="e.g. Dhaka City"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Regions (comma separated)</Label>
              <Input 
                placeholder="e.g. Dhaka North, Dhaka South"
                value={newZone.regions}
                onChange={(e) => setNewZone({ ...newZone, regions: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setZoneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddZone}>Add Zone</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Rate Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Shipping Rate</DialogTitle>
            <DialogDescription>
              Add a new rate to {selectedZone?.name} zone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Rate Name</Label>
              <Input 
                placeholder="e.g. Standard Delivery"
                value={newRate.name}
                onChange={(e) => setNewRate({ ...newRate, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Rate Type</Label>
              <Select defaultValue="flat">
                <SelectTrigger>
                  <SelectValue placeholder="Select rate type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="weight">Weight Based</SelectItem>
                  <SelectItem value="order_amount">Order Amount Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Base Rate (৳)</Label>
              <Input 
                type="number"
                placeholder="0"
                className="w-32"
                value={newRate.rate || ""}
                onChange={(e) => setNewRate({ ...newRate, rate: Number(e.target.value) })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Days</Label>
                <Input 
                  type="number"
                  placeholder="1"
                  value={newRate.min_days}
                  onChange={(e) => setNewRate({ ...newRate, min_days: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Days</Label>
                <Input 
                  type="number"
                  placeholder="3"
                  value={newRate.max_days}
                  onChange={(e) => setNewRate({ ...newRate, max_days: Number(e.target.value) || 3 })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddRate} disabled={!newRate.name || !newRate.rate}>
              Add Rate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rate Dialog */}
      <Dialog open={editRateDialogOpen} onOpenChange={setEditRateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Shipping Rate</DialogTitle>
            <DialogDescription>
              Update the shipping rate details
            </DialogDescription>
          </DialogHeader>
          {editingRate && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Rate Name</Label>
                <Input 
                  placeholder="e.g. Standard Delivery"
                  value={editingRate.name}
                  onChange={(e) => setEditingRate({ ...editingRate, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Base Rate (৳)</Label>
                <Input 
                  type="number"
                  placeholder="0"
                  className="w-32"
                  value={editingRate.rate || ""}
                  onChange={(e) => setEditingRate({ ...editingRate, rate: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Weight (kg)</Label>
                  <Input 
                    type="number"
                    placeholder="Optional"
                    value={editingRate.min_weight ?? ""}
                    onChange={(e) => setEditingRate({ ...editingRate, min_weight: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input 
                    type="number"
                    placeholder="Optional"
                    value={editingRate.max_weight ?? ""}
                    onChange={(e) => setEditingRate({ ...editingRate, max_weight: e.target.value ? Number(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Days</Label>
                  <Input 
                    type="number"
                    placeholder="1"
                    value={editingRate.min_days}
                    onChange={(e) => setEditingRate({ ...editingRate, min_days: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Days</Label>
                  <Input 
                    type="number"
                    placeholder="3"
                    value={editingRate.max_days}
                    onChange={(e) => setEditingRate({ ...editingRate, max_days: Number(e.target.value) || 3 })}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditRateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditRate} disabled={!editingRate?.name || !editingRate?.rate}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
