import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface SalesDataPoint {
  name: string;
  sales: number;
  orders: number;
}

interface SalesChartProps {
  data?: SalesDataPoint[];
  loading?: boolean;
}

export function SalesChart({ data = [], loading = false }: SalesChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card animate-fade-in">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-60 sm:h-80 w-full" />
      </div>
    );
  }

  const hasData = data.some(d => d.sales > 0);

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">Sales Overview</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Monthly sales performance (last 12 months)</p>
      </div>
      <div className="h-60 sm:h-80">
        {!hasData ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No sales data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                tickFormatter={(value) => `৳${value / 1000}k`}
                width={45}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "var(--shadow-md)"
                }}
                formatter={(value: number, name: string) => [
                  name === 'sales' ? `৳${value.toLocaleString()}` : value,
                  name === 'sales' ? 'Sales' : 'Orders'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fill="url(#salesGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
