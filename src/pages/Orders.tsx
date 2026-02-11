import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MoreVertical,
  Eye,
  FileText,
  Truck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  ShoppingBag,
  TrendingUp,
  Trash2,
  X,
  Send,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useOrdersData, type Order, type OrderStatus } from "@/hooks/useOrdersData";
import { format } from "date-fns";
import { toast } from "sonner";
import { SendToCourierModal } from "@/components/orders/SendToCourierModal";
import { BulkSendToCourierModal } from "@/components/orders/BulkSendToCourierModal";
import { PaymentVerificationModal } from "@/components/orders/PaymentVerificationModal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { generateInvoicePDF, orderToInvoiceData } from "@/utils/generateInvoicePDF";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import { DataExport } from "@/components/ui/data-export";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  processing: { label: "Processing", color: "bg-accent/10 text-accent border-accent/20", icon: Package },
  shipped: { label: "Shipped", color: "bg-chart-5/10 text-chart-5 border-chart-5/20", icon: Truck },
  delivered: { label: "Delivered", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
};

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  paid: { label: "Paid", color: "bg-success/10 text-success border-success/20" },
  failed: { label: "Failed", color: "bg-destructive/10 text-destructive border-destructive/20" },
  refunded: { label: "Refunded", color: "bg-muted text-muted-foreground" },
};

// Helper to get shipping address as string
const getShippingAddressString = (address: any): string => {
  if (!address) return 'N/A';
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }
  return 'N/A';
};

export default function Orders() {
  const { orders, stats, isLoading, updateStatus, updatePaymentStatus, verifyPayment, deleteOrder, isVerifying } = useOrdersData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [courierModalOpen, setCourierModalOpen] = useState(false);
  const [courierOrder, setCourierOrder] = useState<Order | null>(null);
  const [bulkCourierModalOpen, setBulkCourierModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationOrder, setVerificationOrder] = useState<Order | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Open courier modal
  const openCourierModal = (order: Order) => {
    setCourierOrder(order);
    setCourierModalOpen(true);
  };

  // Open bulk courier modal
  const openBulkCourierModal = () => {
    setBulkCourierModalOpen(true);
  };

  // Open verification modal
  const openVerificationModal = (order: Order) => {
    setVerificationOrder(order);
    setVerificationModalOpen(true);
  };

  // Handle payment verification
  const handleVerifyPayment = (orderId: string, status: 'paid' | 'failed', notes: string) => {
    verifyPayment({ orderId, paymentStatus: status, notes });
    setVerificationModalOpen(false);
    setVerificationOrder(null);
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_email.toLowerCase().includes(query) ||
        o.customer_phone.includes(query)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter(o => o.status === statusFilter);
    }
    
    return result;
  }, [orders, searchQuery, statusFilter]);

  // Sorting
  const { sortedData: sortedOrders, sortKey, sortDirection, handleSort } = useSorting(filteredOrders);

  // Pagination
  const {
    paginatedData: paginatedOrders,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(sortedOrders, { initialPageSize: 10 });

  // Export columns configuration
  const exportColumns = [
    { key: "order_number" as const, header: "Order #" },
    { key: "customer_name" as const, header: "Customer" },
    { key: "customer_email" as const, header: "Email" },
    { key: "customer_phone" as const, header: "Phone" },
    { key: "total" as const, header: "Total" },
    { key: "status" as const, header: "Status" },
    { key: "payment_status" as const, header: "Payment Status" },
    { key: "payment_method" as const, header: "Payment Method" },
    { key: "created_at" as const, header: "Date" },
  ];

  // Update order status
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateStatus({ orderId, status: newStatus });
  };

  // Update payment status
  const handleUpdatePaymentStatus = (orderId: string, paymentStatus: string) => {
    updatePaymentStatus({ orderId, paymentStatus });
  };

  // View order details
  const viewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // Generate invoice PDF
  const generateInvoice = (order: Order) => {
    const invoiceData = orderToInvoiceData({
      order_number: order.order_number,
      created_at: order.created_at,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      customer_phone: order.customer_phone,
      shipping_address: order.shipping_address,
      items: order.items,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      discount: order.discount,
      total: order.total,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
    });
    generateInvoicePDF(invoiceData);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  // Bulk selection handlers
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const clearSelection = () => {
    setSelectedOrderIds(new Set());
  };

  // Get selected orders
  const selectedOrders = useMemo(() => {
    return orders.filter(o => selectedOrderIds.has(o.id));
  }, [orders, selectedOrderIds]);

  // Bulk actions
  const handleBulkStatusUpdate = (newStatus: OrderStatus) => {
    selectedOrderIds.forEach(orderId => {
      updateStatus({ orderId, status: newStatus });
    });
    toast.success(`${selectedOrderIds.size} orders status updated to ${statusConfig[newStatus].label}`);
    clearSelection();
  };

  const handleBulkPaymentUpdate = (paymentStatus: string) => {
    selectedOrderIds.forEach(orderId => {
      updatePaymentStatus({ orderId, paymentStatus });
    });
    toast.success(`${selectedOrderIds.size} orders payment updated to ${paymentStatusConfig[paymentStatus].label}`);
    clearSelection();
  };

  const handleBulkInvoiceDownload = () => {
    selectedOrders.forEach(order => {
      generateInvoice(order);
    });
    toast.success(`${selectedOrders.length} invoices downloaded`);
  };

  const handleBulkDelete = () => {
    selectedOrderIds.forEach(orderId => {
      deleteOrder(orderId);
    });
    toast.success(`${selectedOrderIds.size} orders deleted`);
    clearSelection();
    setBulkDeleteOpen(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track customer orders ({orders.length} total)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingBag className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <Package className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
                <Truck className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.shipped}</p>
                <p className="text-sm text-muted-foreground">Shipped</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">৳{(stats.revenue / 1000).toFixed(1)}k</p>
                <p className="text-sm text-muted-foreground">Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 bg-card">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataExport
            data={sortedOrders}
            filename={`orders-${format(new Date(), 'yyyy-MM-dd')}`}
            columns={exportColumns}
          />
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrderIds.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-medium">
                    {selectedOrderIds.size} selected
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 px-2">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <Separator orientation="vertical" className="h-6" />
                
                {/* Bulk Status Update */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Package className="mr-2 h-4 w-4" />
                      Update Status
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleBulkStatusUpdate(key as OrderStatus)}
                      >
                        <config.icon className="mr-2 h-4 w-4" />
                        {config.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Payment Update */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Update Payment
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover">
                    {Object.entries(paymentStatusConfig).map(([key, config]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => handleBulkPaymentUpdate(key)}
                      >
                        {config.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Bulk Invoice Download */}
                <Button variant="outline" size="sm" className="h-8" onClick={handleBulkInvoiceDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Invoices
                </Button>

                {/* Bulk Send to Courier */}
                <Button variant="outline" size="sm" className="h-8" onClick={openBulkCourierModal}>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Courier
                </Button>

                {/* Bulk Delete */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-destructive hover:text-destructive" 
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={paginatedOrders.length > 0 && selectedOrderIds.size === paginatedOrders.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <SortableTableHead
                    sortKey="order_number"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Order
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="customer_name"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Customer
                  </SortableTableHead>
                  <TableHead>Items</TableHead>
                  <SortableTableHead
                    sortKey="total"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Total
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="payment_status"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Payment
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="created_at"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  >
                    Date
                  </SortableTableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No orders found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status]?.icon || Clock;
                    const statusStyle = statusConfig[order.status]?.color || statusConfig.pending.color;
                    const statusLabel = statusConfig[order.status]?.label || order.status;
                    const isSelected = selectedOrderIds.has(order.id);
                    
                    return (
                      <TableRow key={order.id} className={cn(isSelected && "bg-primary/5")}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectOrder(order.id)}
                            aria-label={`Select order ${order.order_number}`}
                          />
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-foreground">{order.order_number}</p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{order.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_phone || order.customer_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{order.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{order.payment_method}</span>
                              {order.payment_verified_at && (
                                <span title="Verified">
                                  <ShieldCheck className="h-3 w-3 text-success" />
                                </span>
                              )}
                            </div>
                            <Select 
                              value={order.payment_status} 
                              onValueChange={(value) => handleUpdatePaymentStatus(order.id, value)}
                            >
                              <SelectTrigger className={cn(
                                "h-7 w-24 text-xs border",
                                paymentStatusConfig[order.payment_status]?.color
                              )}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-popover">
                                {Object.entries(paymentStatusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", statusStyle)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-popover">
                              <DropdownMenuItem onClick={() => viewDetails(order)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generateInvoice(order)}>
                                <FileText className="mr-2 h-4 w-4" />
                                Download Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openCourierModal(order)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send to Courier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openVerificationModal(order)}
                                className="text-primary"
                              >
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Verify Payment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                Update Status
                              </DropdownMenuItem>
                              {Object.entries(statusConfig).map(([key, config]) => (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => handleUpdateStatus(order.id, key as OrderStatus)}
                                  disabled={order.status === key}
                                  className="pl-6"
                                >
                                  <config.icon className="mr-2 h-3 w-3" />
                                  {config.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => deleteOrder(order.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Order
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
            {totalItems > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl bg-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-accent" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Order placed on {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn("gap-1", statusConfig[selectedOrder.status]?.color || statusConfig.pending.color)}>
                  {React.createElement(statusConfig[selectedOrder.status]?.icon || Clock, { className: "h-3 w-3" })}
                  {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
                <Button size="sm" variant="outline" onClick={() => generateInvoice(selectedOrder)}>
                  <Download className="mr-2 h-4 w-4" />
                  Invoice
                </Button>
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Customer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {selectedOrder.customer_email}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {selectedOrder.customer_phone || '-'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Shipping Address</h4>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mt-1" />
                    <span>{getShippingAddressString(selectedOrder.shipping_address)}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="font-semibold text-sm mb-3">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          ৳{item.unit_price.toLocaleString()} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium">৳{item.total_price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>৳{selectedOrder.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>৳{selectedOrder.shipping_cost.toLocaleString()}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span>Discount</span>
                    <span>-৳{selectedOrder.discount.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>৳{selectedOrder.total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Info */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{selectedOrder.payment_method}</p>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs mt-1",
                        paymentStatusConfig[selectedOrder.payment_status]?.color
                      )}
                    >
                      {paymentStatusConfig[selectedOrder.payment_status]?.label || selectedOrder.payment_status}
                    </Badge>
                  </div>
                </div>
                <Select 
                  value={selectedOrder.payment_status} 
                  onValueChange={(value) => handleUpdatePaymentStatus(selectedOrder.id, value)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {Object.entries(paymentStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send to Courier Modal */}
      <SendToCourierModal
        open={courierModalOpen}
        onOpenChange={setCourierModalOpen}
        order={courierOrder ? {
          id: courierOrder.id,
          order_number: courierOrder.order_number,
          customer_name: courierOrder.customer_name,
          customer_phone: courierOrder.customer_phone,
          customer_email: courierOrder.customer_email,
          shipping_address: courierOrder.shipping_address,
          total: courierOrder.total,
          items: courierOrder.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
          })),
        } : null}
        onSuccess={() => {
          handleUpdateStatus(courierOrder!.id, 'shipped');
        }}
      />

      {/* Bulk Send to Courier Modal */}
      <BulkSendToCourierModal
        open={bulkCourierModalOpen}
        onOpenChange={setBulkCourierModalOpen}
        orders={selectedOrders.map(order => ({
          id: order.id,
          order_number: order.order_number,
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          customer_email: order.customer_email,
          shipping_address: order.shipping_address,
          total: order.total,
          items: order.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
          })),
        }))}
        onSuccess={(successfulIds) => {
          successfulIds.forEach(id => handleUpdateStatus(id, 'shipped'));
          clearSelection();
        }}
      />

      {/* Payment Verification Modal */}
      <PaymentVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        order={verificationOrder ? {
          id: verificationOrder.id,
          order_number: verificationOrder.order_number,
          customer_name: verificationOrder.customer_name,
          customer_phone: verificationOrder.customer_phone,
          payment_method: verificationOrder.payment_method,
          payment_status: verificationOrder.payment_status,
          total: verificationOrder.total,
          notes: verificationOrder.notes,
          created_at: verificationOrder.created_at,
          payment_verified_at: verificationOrder.payment_verified_at,
          payment_verification_notes: verificationOrder.payment_verification_notes,
        } : null}
        onVerify={handleVerifyPayment}
        isVerifying={isVerifying}
      />

      {/* Bulk Delete Confirmation */}
      <DeleteConfirmModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={handleBulkDelete}
        title="Delete Orders"
        description={`Are you sure you want to delete ${selectedOrderIds.size} orders? This action cannot be undone.`}
      />
    </AdminLayout>
  );
}
