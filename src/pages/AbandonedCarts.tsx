import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Search, ShoppingCart, Filter } from "lucide-react";
import { AbandonedCartStats } from "@/components/admin/AbandonedCartStats";
import { AbandonedCartTable } from "@/components/admin/AbandonedCartTable";
import { useAbandonedCartsData, type AbandonedCart } from "@/hooks/useAbandonedCartsData";

type FilterStatus = "all" | "abandoned" | "recovered" | "pending";

export default function AbandonedCarts() {
  const { abandonedCarts, stats, isLoading, refetch } = useAbandonedCartsData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  const filteredCarts = abandonedCarts.filter((cart) => {
    // Search filter
    const matchesSearch =
      searchTerm === "" ||
      cart.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cart.session_id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter === "abandoned") {
      matchesStatus = !!cart.abandoned_at && !cart.recovered_at;
    } else if (statusFilter === "recovered") {
      matchesStatus = !!cart.recovered_at;
    } else if (statusFilter === "pending") {
      matchesStatus = !!cart.abandoned_at && !cart.recovered_at && cart.reminder_sent_count < 3;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-7 w-7 text-primary" />
              Abandoned Carts
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and recover abandoned shopping carts
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <AbandonedCartStats stats={stats} />

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Cart Recovery</CardTitle>
            <CardDescription>
              View and manage abandoned shopping carts. Automatic email reminders are sent at 1h, 24h, and 72h.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="space-y-4" onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="all">
                    All ({abandonedCarts.length})
                  </TabsTrigger>
                  <TabsTrigger value="abandoned">
                    Abandoned ({stats.pending})
                  </TabsTrigger>
                  <TabsTrigger value="recovered">
                    Recovered ({stats.recovered})
                  </TabsTrigger>
                </TabsList>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                </div>
              </div>

              <TabsContent value="all" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
              <TabsContent value="abandoned" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
              <TabsContent value="recovered" className="mt-4">
                <AbandonedCartTable carts={filteredCarts} isLoading={isLoading} onRefresh={refetch} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
