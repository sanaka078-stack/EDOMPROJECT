import React, { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingBag,
  Users,
  UserPlus,
  Crown,
  Package,
  Clock,
  CheckCircle2,
  Ban,
  Send,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCustomersData, type Customer } from "@/hooks/useCustomersData";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import { DataExport } from "@/components/ui/data-export";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";

const tierConfig = {
  bronze: { color: "bg-amber-700/10 text-amber-700 border-amber-700/20", minSpent: 0 },
  silver: { color: "bg-slate-400/10 text-slate-500 border-slate-400/20", minSpent: 20000 },
  gold: { color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", minSpent: 50000 },
  platinum: { color: "bg-violet-500/10 text-violet-500 border-violet-500/20", minSpent: 80000 },
};

const statusConfig = {
  active: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  inactive: { color: "bg-muted text-muted-foreground border-muted", icon: Clock },
  blocked: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: Ban },
};

// Helper function to get customer name
const getCustomerName = (customer: Customer): string => {
  return customer.full_name || customer.email?.split('@')[0] || 'Unknown';
};

// Helper function to get loyalty tier based on total spent
const getLoyaltyTier = (totalSpent: number): keyof typeof tierConfig => {
  if (totalSpent >= 80000) return 'platinum';
  if (totalSpent >= 50000) return 'gold';
  if (totalSpent >= 20000) return 'silver';
  return 'bronze';
};

// Helper function to get city from address
const getCity = (address: any): string | null => {
  if (!address) return null;
  if (typeof address === 'string') return null;
  if (typeof address === 'object' && address.city) return address.city;
  return null;
};

// Helper function to get address string
const getAddressString = (address: any): string | null => {
  if (!address) return null;
  if (typeof address === 'string') return address;
  if (typeof address === 'object') {
    const parts = [address.street, address.area, address.city].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  return null;
};

export default function Customers() {
  const { customers, loading, stats } = useCustomersData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Calculate platinum count
  const platinumCount = useMemo(() => {
    return customers.filter(c => getLoyaltyTier(Number(c.total_spent)) === 'platinum').length;
  }, [customers]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let result = [...customers];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => {
        const name = getCustomerName(c).toLowerCase();
        const city = getCity(c.address);
        return name.includes(query) ||
          (c.email && c.email.toLowerCase().includes(query)) ||
          (c.phone && c.phone.includes(query)) ||
          (city && city.toLowerCase().includes(query));
      });
    }
    
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter);
    }
    
    if (tierFilter !== "all") {
      result = result.filter(c => getLoyaltyTier(Number(c.total_spent)) === tierFilter);
    }
    
    return result;
  }, [customers, searchQuery, statusFilter, tierFilter]);

  // Sorting
  const { sortedData: sortedCustomers, sortKey, sortDirection, handleSort } = useSorting(filteredCustomers);

  // Pagination
  const {
    paginatedData: paginatedCustomers,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(sortedCustomers, { initialPageSize: 10 });

  // Export columns configuration
  const exportColumns = [
    { key: "full_name" as const, header: "Name" },
    { key: "email" as const, header: "Email" },
    { key: "phone" as const, header: "Phone" },
    { key: "total_orders" as const, header: "Total Orders" },
    { key: "total_spent" as const, header: "Total Spent" },
    { key: (c: Customer) => getLoyaltyTier(Number(c.total_spent)), header: "Tier" },
    { key: "status" as const, header: "Status" },
    { key: "created_at" as const, header: "Joined Date" },
  ];

  const viewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const sendEmail = (customer: Customer) => {
    toast.success(`Email dialog opened for ${getCustomerName(customer)}`);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatus = (status: string | undefined): keyof typeof statusConfig => {
    if (status && status in statusConfig) return status as keyof typeof statusConfig;
    return 'active';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1 max-w-md" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
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
          <h1 className="font-display text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer base ({customers.length} customers)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <UserPlus className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.newThisMonth}</p>
                <p className="text-sm text-muted-foreground">New This Month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                <DollarSign className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">৳{(stats.totalRevenue / 1000).toFixed(0)}k</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-5/10">
                <Crown className="h-6 w-6 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{platinumCount}</p>
                <p className="text-sm text-muted-foreground">Platinum Members</p>
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
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 bg-card">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-36 bg-card">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DataExport
            data={sortedCustomers}
            filename={`customers-${new Date().toISOString().split('T')[0]}`}
            columns={exportColumns}
          />
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <SortableTableHead
                    sortKey="full_name"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[250px]"
                  >
                    Customer
                  </SortableTableHead>
                  <TableHead>Contact</TableHead>
                  <SortableTableHead
                    sortKey="total_orders"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-center"
                  >
                    Orders
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="total_spent"
                    currentSortKey={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="text-right"
                  >
                    Total Spent
                  </SortableTableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No customers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((customer) => {
                    const customerName = getCustomerName(customer);
                    const tier = getLoyaltyTier(Number(customer.total_spent));
                    const status = getStatus(customer.status);
                    const StatusIcon = statusConfig[status].icon;
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(customerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">{customerName}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {formatDate(customer.created_at)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">{customer.email || '-'}</p>
                            <p className="text-xs text-muted-foreground">{customer.phone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-medium">{customer.total_orders}</span>
                            {customer.last_order_date && (
                              <span className="text-xs text-muted-foreground">
                                Last: {formatDate(customer.last_order_date)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ৳{Number(customer.total_spent).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 capitalize", tierConfig[tier].color)}>
                            <Crown className="h-3 w-3" />
                            {tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1 capitalize", statusConfig[status].color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => viewDetails(customer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => sendEmail(customer)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Email
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

      {/* Customer Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View detailed information about this customer
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (() => {
            const customerName = getCustomerName(selectedCustomer);
            const tier = getLoyaltyTier(Number(selectedCustomer.total_spent));
            const addressStr = getAddressString(selectedCustomer.address);
            const city = getCity(selectedCustomer.address);
            
            return (
              <div className="space-y-6">
                {/* Customer Header */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(customerName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{customerName}</h3>
                      <Badge 
                        variant="outline" 
                        className={cn("gap-1 capitalize", tierConfig[tier].color)}
                      >
                        <Crown className="h-3 w-3" />
                        {tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Customer since {formatDate(selectedCustomer.created_at)}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Contact Info */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedCustomer.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {[addressStr, city].filter(Boolean).join(', ') || '-'}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingBag className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                      <p className="text-xs text-muted-foreground">Total Orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <DollarSign className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">৳{Number(selectedCustomer.total_spent).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Calendar className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
                      <p className="text-2xl font-bold">
                        {selectedCustomer.last_order_date 
                          ? formatDate(selectedCustomer.last_order_date)
                          : '-'}
                      </p>
                      <p className="text-xs text-muted-foreground">Last Order</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Recent Orders</h4>
                      <div className="space-y-2">
                        {selectedCustomer.orders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">৳{order.total.toLocaleString()}</p>
                              <Badge variant="outline" className="text-xs">{order.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
