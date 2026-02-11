import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MousePointer,
  Target,
  Award,
  Calendar,
  MapPin,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  subtitle,
  loading,
}: { 
  title: string; 
  value: string; 
  change: string; 
  changeType: "positive" | "negative"; 
  icon: React.ElementType;
  subtitle?: string;
  loading?: boolean;
}) => (
  <Card>
    <CardContent className="p-6">
      {loading ? (
        <div className="space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex items-center text-sm font-medium",
                changeType === "positive" ? "text-success" : "text-destructive"
              )}>
                {changeType === "positive" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {change}
              </span>
              {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
            </div>
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            changeType === "positive" ? "bg-success/10" : "bg-destructive/10"
          )}>
            <Icon className={cn("h-6 w-6", changeType === "positive" ? "text-success" : "text-destructive")} />
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);


export default function Analytics() {
  const [period, setPeriod] = useState("30d");
  const { 
    stats, 
    revenueData, 
    dailySalesData, 
    categoryData, 
    topProducts, 
    customerInsights,
    trafficSources,
    loading,
    refetch,
  } = useAnalyticsData(period);

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `৳${(value / 100000).toFixed(2)} লাখ`;
    }
    return `৳${value.toLocaleString()}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Detailed insights and performance metrics
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-card">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            change={`${Math.abs(stats.revenueChange)}%`}
            changeType={stats.revenueChange >= 0 ? "positive" : "negative"}
            icon={DollarSign}
            subtitle="vs last period"
            loading={loading}
          />
          <StatCard
            title="Total Orders"
            value={stats.totalOrders.toLocaleString()}
            change={`${Math.abs(stats.ordersChange)}%`}
            changeType={stats.ordersChange >= 0 ? "positive" : "negative"}
            icon={ShoppingCart}
            subtitle="vs last period"
            loading={loading}
          />
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers.toLocaleString()}
            change={`${Math.abs(stats.customersChange)}%`}
            changeType={stats.customersChange >= 0 ? "positive" : "negative"}
            icon={Users}
            subtitle="vs last period"
            loading={loading}
          />
          <StatCard
            title="Avg. Order Value"
            value={formatCurrency(stats.avgOrderValue)}
            change={`${Math.abs(stats.avgOrderChange)}%`}
            changeType={stats.avgOrderChange >= 0 ? "positive" : "negative"}
            icon={Target}
            subtitle="vs last period"
            loading={loading}
          />
        </div>

        {/* Main Charts */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="visitors">Daily Sales</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue and profit trends</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : revenueData.every(d => d.revenue === 0) ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No revenue data available yet
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `৳${v/1000}k`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          formatter={(value: number) => [`৳${value.toLocaleString()}`, ""]}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorRevenue)" />
                        <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(var(--chart-3))" fillOpacity={1} fill="url(#colorProfit)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders Trend</CardTitle>
                <CardDescription>Monthly order count</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : revenueData.every(d => d.orders === 0) ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No order data available yet
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Bar dataKey="orders" name="Orders" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visitors">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales & Visitors</CardTitle>
                <CardDescription>Last 14 days performance</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : dailySalesData.every(d => d.sales === 0) ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No daily sales data available yet
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailySalesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="sales" name="Sales (৳)" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
                        <Line yAxisId="right" type="monotone" dataKey="visitors" name="Visitors" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Second Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Category Performance
              </CardTitle>
              <CardDescription>Sales distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <Skeleton className="h-48 w-48 rounded-full" />
                  <div className="flex-1 space-y-3 w-full">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                </div>
              ) : categoryData.length === 0 || categoryData[0].name === 'No Data' ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No category data available yet
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    {categoryData.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{cat.name}</span>
                            <span className="text-sm text-muted-foreground">{cat.value}%</span>
                          </div>
                          <Progress value={cat.value} className="h-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Top Selling Products
              </CardTitle>
              <CardDescription>Best performers this period</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  No product sales data available yet
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, idx) => (
                    <div key={product.name} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted shrink-0">
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} sold</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">৳{(product.revenue / 1000).toFixed(0)}k</p>
                        <p className={cn(
                          "flex items-center justify-end text-xs",
                          product.growth >= 0 ? "text-success" : "text-destructive"
                        )}>
                          {product.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                          {Math.abs(product.growth)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Customer Insights */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* New vs Returning */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-accent" />
                Customer Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                  <div className="mt-4 flex gap-6">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ) : customerInsights.newVsReturning.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No customer data available yet
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={customerInsights.newVsReturning}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {customerInsights.newVsReturning.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center gap-6">
                    {customerInsights.newVsReturning.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm">{item.name}: {item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Cities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                Top Cities
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : customerInsights.topCities.length === 0 || customerInsights.topCities[0].city === 'No Data' ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No city data available yet
                </div>
              ) : (
                <div className="space-y-3">
                  {customerInsights.topCities.map((city) => (
                    <div key={city.city} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{city.city}</span>
                          <span className="text-xs text-muted-foreground">{city.customers.toLocaleString()}</span>
                        </div>
                        <Progress value={city.percentage} className="h-1.5" />
                      </div>
                      <Badge variant="outline" className="text-xs">{city.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Traffic Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5 text-accent" />
              Traffic Sources
            </CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            ) : trafficSources.every(s => s.visitors === 0) ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                No traffic data available yet. Analytics events will be tracked automatically.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {trafficSources.map((source) => (
                  <div key={source.source} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{source.source}</span>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          source.growth >= 0 
                            ? "bg-success/10 text-success border-success/20" 
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {source.growth >= 0 ? '+' : ''}{source.growth}%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{source.visitors.toLocaleString()}</p>
                    <Progress value={source.percentage} className="h-1.5" />
                    <p className="text-xs text-muted-foreground">{source.percentage}% of traffic</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
