import { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ShoppingCart,
  Truck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Filter,
  ArrowUpDown,
  Bell,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  maxStock: number;
  unitCost: number;
  lastRestocked: string;
  supplier: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  location: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  totalOrders: number;
  status: 'active' | 'inactive';
  paymentTerms: string;
  leadTime: string;
}

interface StockAlert {
  id: string;
  productName: string;
  sku: string;
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  message: string;
  severity: 'warning' | 'critical' | 'info';
  createdAt: string;
  isRead: boolean;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  items: { productName: string; quantity: number; unitCost: number }[];
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'shipped' | 'received' | 'cancelled';
  createdAt: string;
  expectedDelivery: string;
}

const initialInventory: InventoryItem[] = [
  { id: "inv-1", productId: "prod-1", productName: "Smart Watch Pro", sku: "SW-001", category: "Electronics", currentStock: 45, reorderPoint: 20, maxStock: 100, unitCost: 2500, lastRestocked: "2024-01-15", supplier: "Tech Supply BD", status: "in_stock", location: "A-01" },
  { id: "inv-2", productId: "prod-2", productName: "Wireless Earbuds", sku: "WE-002", category: "Electronics", currentStock: 12, reorderPoint: 25, maxStock: 80, unitCost: 1200, lastRestocked: "2024-01-10", supplier: "Gadget Hub", status: "low_stock", location: "A-02" },
  { id: "inv-3", productId: "prod-3", productName: "Laptop Stand", sku: "LS-003", category: "Accessories", currentStock: 0, reorderPoint: 15, maxStock: 50, unitCost: 800, lastRestocked: "2024-01-05", supplier: "Office Supply", status: "out_of_stock", location: "B-01" },
  { id: "inv-4", productId: "prod-4", productName: "USB-C Hub", sku: "UC-004", category: "Accessories", currentStock: 85, reorderPoint: 20, maxStock: 60, unitCost: 1500, lastRestocked: "2024-01-18", supplier: "Tech Supply BD", status: "overstock", location: "B-02" },
  { id: "inv-5", productId: "prod-5", productName: "Mechanical Keyboard", sku: "MK-005", category: "Electronics", currentStock: 28, reorderPoint: 10, maxStock: 40, unitCost: 3500, lastRestocked: "2024-01-12", supplier: "Gadget Hub", status: "in_stock", location: "C-01" },
  { id: "inv-6", productId: "prod-6", productName: "Gaming Mouse", sku: "GM-006", category: "Electronics", currentStock: 8, reorderPoint: 15, maxStock: 50, unitCost: 1800, lastRestocked: "2024-01-08", supplier: "Gadget Hub", status: "low_stock", location: "C-02" },
];

const initialSuppliers: Supplier[] = [
  { id: "sup-1", name: "Tech Supply BD", email: "contact@techsupply.bd", phone: "01711-123456", address: "Gulshan-2, Dhaka", category: "Electronics", rating: 4.8, totalOrders: 156, status: "active", paymentTerms: "Net 30 Days", leadTime: "3-5 Days" },
  { id: "sup-2", name: "Gadget Hub", email: "sales@gadgethub.com", phone: "01812-654321", address: "Banani, Dhaka", category: "Electronics", rating: 4.5, totalOrders: 98, status: "active", paymentTerms: "Net 15 Days", leadTime: "2-4 Days" },
  { id: "sup-3", name: "Office Supply", email: "info@officesupply.com", phone: "01912-789012", address: "Motijheel, Dhaka", category: "Accessories", rating: 4.2, totalOrders: 67, status: "active", paymentTerms: "Advance Payment", leadTime: "1-3 Days" },
  { id: "sup-4", name: "Mobile World", email: "order@mobileworld.bd", phone: "01611-456789", address: "Elephant Road, Dhaka", category: "Mobile", rating: 4.0, totalOrders: 45, status: "inactive", paymentTerms: "Net 7 Days", leadTime: "5-7 Days" },
];

const initialAlerts: StockAlert[] = [
  { id: "alert-1", productName: "Wireless Earbuds", sku: "WE-002", type: "low_stock", message: "Stock below reorder point (12/25)", severity: "warning", createdAt: "2024-01-21 09:00", isRead: false },
  { id: "alert-2", productName: "Laptop Stand", sku: "LS-003", type: "out_of_stock", message: "Out of stock - urgent reorder needed", severity: "critical", createdAt: "2024-01-21 08:30", isRead: false },
  { id: "alert-3", productName: "USB-C Hub", sku: "UC-004", type: "overstock", message: "Exceeded max stock (85/60)", severity: "info", createdAt: "2024-01-20 15:00", isRead: true },
  { id: "alert-4", productName: "Gaming Mouse", sku: "GM-006", type: "low_stock", message: "Stock below reorder point (8/15)", severity: "warning", createdAt: "2024-01-20 14:00", isRead: false },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  { id: "PO-001", supplier: "Tech Supply BD", items: [{ productName: "Smart Watch Pro", quantity: 50, unitCost: 2500 }], totalAmount: 125000, status: "pending", createdAt: "2024-01-20", expectedDelivery: "2024-01-25" },
  { id: "PO-002", supplier: "Gadget Hub", items: [{ productName: "Wireless Earbuds", quantity: 30, unitCost: 1200 }, { productName: "Gaming Mouse", quantity: 20, unitCost: 1800 }], totalAmount: 72000, status: "approved", createdAt: "2024-01-19", expectedDelivery: "2024-01-23" },
  { id: "PO-003", supplier: "Office Supply", items: [{ productName: "Laptop Stand", quantity: 25, unitCost: 800 }], totalAmount: 20000, status: "shipped", createdAt: "2024-01-18", expectedDelivery: "2024-01-21" },
];

const statusConfig = {
  in_stock: { label: "In Stock", color: "bg-green-100 text-green-800", icon: CheckCircle },
  low_stock: { label: "Low Stock", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  out_of_stock: { label: "Out of Stock", color: "bg-red-100 text-red-800", icon: XCircle },
  overstock: { label: "Overstock", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
};

const poStatusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
  received: { label: "Received", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [alerts, setAlerts] = useState<StockAlert[]>(initialAlerts);
  const [purchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [stockUpdateDialogOpen, setStockUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState({ quantity: 0, type: "add", reason: "" });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    paymentTerms: "",
    leadTime: ""
  });

  const stats = useMemo(() => ({
    totalProducts: inventory.length,
    lowStock: inventory.filter(i => i.status === 'low_stock').length,
    outOfStock: inventory.filter(i => i.status === 'out_of_stock').length,
    totalValue: inventory.reduce((acc, i) => acc + (i.currentStock * i.unitCost), 0),
    unreadAlerts: alerts.filter(a => !a.isRead).length
  }), [inventory, alerts]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStockUpdate = () => {
    if (!selectedItem || stockAdjustment.quantity === 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const newStock = stockAdjustment.type === "add" 
      ? selectedItem.currentStock + stockAdjustment.quantity
      : selectedItem.currentStock - stockAdjustment.quantity;

    if (newStock < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    let newStatus: InventoryItem['status'] = 'in_stock';
    if (newStock === 0) newStatus = 'out_of_stock';
    else if (newStock < selectedItem.reorderPoint) newStatus = 'low_stock';
    else if (newStock > selectedItem.maxStock) newStatus = 'overstock';

    setInventory(inventory.map(item => 
      item.id === selectedItem.id 
        ? { ...item, currentStock: newStock, status: newStatus, lastRestocked: new Date().toISOString().split('T')[0] }
        : item
    ));

    setStockUpdateDialogOpen(false);
    setSelectedItem(null);
    setStockAdjustment({ quantity: 0, type: "add", reason: "" });
    toast.success("Stock updated");
  };

  const handleAddSupplier = () => {
    if (!newSupplier.name || !newSupplier.email || !newSupplier.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    const supplier: Supplier = {
      id: `sup-${Date.now()}`,
      ...newSupplier,
      rating: 0,
      totalOrders: 0,
      status: 'active'
    };

    setSuppliers([supplier, ...suppliers]);
    setNewSupplier({ name: "", email: "", phone: "", address: "", category: "", paymentTerms: "", leadTime: "" });
    setSupplierDialogOpen(false);
    toast.success("Supplier added");
  };

  const markAlertAsRead = (alertId: string) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.min((current / max) * 100, 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Manage stock levels, suppliers, and purchase orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSupplierDialogOpen(true)}>
              <Building2 className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{stats.totalProducts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold">{stats.outOfStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">৳{stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-orange-100">
                  <Bell className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Alerts</p>
                  <p className="text-2xl font-bold">{stats.unreadAlerts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {stats.unreadAlerts > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                  {stats.unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
            <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          </TabsList>

          {/* Stock Levels */}
          <TabsContent value="stock" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Level</TableHead>
                      <TableHead>Reorder Point</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => {
                      const status = statusConfig[item.status];
                      const StatusIcon = status.icon;
                      const stockPercentage = getStockPercentage(item.currentStock, item.maxStock);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">Location: {item.location}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{item.sku}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{item.currentStock} / {item.maxStock}</span>
                              </div>
                              <Progress 
                                value={stockPercentage} 
                                className={`h-2 ${
                                  item.status === 'out_of_stock' ? '[&>div]:bg-red-500' :
                                  item.status === 'low_stock' ? '[&>div]:bg-yellow-500' :
                                  item.status === 'overstock' ? '[&>div]:bg-blue-500' :
                                  '[&>div]:bg-green-500'
                                }`}
                              />
                            </div>
                          </TableCell>
                          <TableCell>{item.reorderPoint}</TableCell>
                          <TableCell>৳{item.unitCost.toLocaleString()}</TableCell>
                          <TableCell>{item.supplier}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ArrowUpDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedItem(item);
                                  setStockUpdateDialogOpen(true);
                                }}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Update Stock
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Reorder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts */}
          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`${!alert.isRead ? 'border-l-4 border-l-orange-500' : ''}`}
                  onClick={() => markAlertAsRead(alert.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100' :
                        alert.severity === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {alert.type === 'out_of_stock' ? (
                          <XCircle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                        ) : alert.type === 'low_stock' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold">{alert.productName}</h4>
                            <p className="text-sm text-muted-foreground font-mono">{alert.sku}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{alert.createdAt}</span>
                        </div>
                        <p className="mt-2">{alert.message}</p>
                      </div>
                      {!alert.isRead && (
                        <Badge variant="destructive" className="text-xs">New</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Suppliers */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {suppliers.map((supplier) => (
                <Card key={supplier.id} className={supplier.status === 'inactive' ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{supplier.name}</CardTitle>
                          <CardDescription>{supplier.category}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={supplier.status === 'active' ? 'default' : 'secondary'}>
                        {supplier.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {supplier.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {supplier.phone}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {supplier.address}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Rating: </span>
                        <span className="font-medium">{supplier.rating}/5</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Total Orders: </span>
                        <span className="font-medium">{supplier.totalOrders}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Lead Time: </span>
                        <span className="font-medium">{supplier.leadTime}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expected Delivery</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map((order) => {
                      const status = poStatusConfig[order.status];
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">{order.id}</TableCell>
                          <TableCell>{order.supplier}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.productName} x {item.quantity}
                                </div>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">৳{order.totalAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={status.color}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>{order.expectedDelivery}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Truck className="h-4 w-4 mr-1" />
                              Track
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stock Update Dialog */}
      <Dialog open={stockUpdateDialogOpen} onOpenChange={setStockUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              Update stock for {selectedItem?.productName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Current Stock:</span>
                <span className="font-medium">{selectedItem?.currentStock}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Reorder Point:</span>
                <span className="font-medium">{selectedItem?.reorderPoint}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adjustment Type</Label>
                <Select 
                  value={stockAdjustment.type} 
                  onValueChange={(value) => setStockAdjustment({ ...stockAdjustment, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add</SelectItem>
                    <SelectItem value="subtract">Subtract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input 
                  type="number"
                  value={stockAdjustment.quantity}
                  onChange={(e) => setStockAdjustment({ ...stockAdjustment, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea 
                placeholder="Enter reason for stock adjustment..."
                value={stockAdjustment.reason}
                onChange={(e) => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockUpdateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleStockUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Supplier</DialogTitle>
            <DialogDescription>
              Add a new supplier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Name *</Label>
                <Input 
                  placeholder="Enter name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  placeholder="e.g., Electronics"
                  value={newSupplier.category}
                  onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="email@example.com"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input 
                  placeholder="01XXX-XXXXXX"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea 
                placeholder="Enter full address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input 
                  placeholder="e.g., Net 30 Days"
                  value={newSupplier.paymentTerms}
                  onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Lead Time</Label>
                <Input 
                  placeholder="e.g., 3-5 Days"
                  value={newSupplier.leadTime}
                  onChange={(e) => setNewSupplier({ ...newSupplier, leadTime: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupplierDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
