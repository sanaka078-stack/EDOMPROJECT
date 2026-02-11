import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingCart, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Mail,
  Target,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AbandonedCartStats as StatsType } from "@/hooks/useAbandonedCartsData";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: "positive" | "negative" | "neutral";
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, trend = "neutral", subtitle }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            trend === "positive" && "bg-success/10",
            trend === "negative" && "bg-destructive/10",
            trend === "neutral" && "bg-muted"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              trend === "positive" && "text-success",
              trend === "negative" && "text-destructive",
              trend === "neutral" && "text-muted-foreground"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AbandonedCartStatsProps {
  stats: StatsType;
}

export function AbandonedCartStats({ stats }: AbandonedCartStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Abandoned"
        value={stats.totalAbandoned}
        icon={ShoppingCart}
        trend="negative"
        subtitle="Carts left behind"
      />
      <StatCard
        title="Recovered"
        value={stats.recovered}
        icon={CheckCircle}
        trend="positive"
        subtitle="Successfully recovered"
      />
      <StatCard
        title="Recovery Rate"
        value={`${stats.recoveryRate}%`}
        icon={Target}
        trend={stats.recoveryRate >= 10 ? "positive" : "negative"}
        subtitle="Conversion success"
      />
      <StatCard
        title="Pending Recovery"
        value={stats.pending}
        icon={Clock}
        trend="neutral"
        subtitle="Awaiting action"
      />
      <StatCard
        title="Lost Revenue"
        value={`৳${stats.totalLostRevenue.toLocaleString()}`}
        icon={AlertTriangle}
        trend="negative"
        subtitle="Potential sales lost"
      />
      <StatCard
        title="Recovered Revenue"
        value={`৳${stats.totalRecoveredRevenue.toLocaleString()}`}
        icon={DollarSign}
        trend="positive"
        subtitle="Sales recovered"
      />
      <StatCard
        title="Avg Cart Value"
        value={`৳${stats.avgCartValue.toLocaleString()}`}
        icon={TrendingUp}
        trend="neutral"
        subtitle="Per abandoned cart"
      />
      <StatCard
        title="Reminders Sent"
        value={stats.remindersSent}
        icon={Mail}
        trend="neutral"
        subtitle="Email reminders"
      />
    </div>
  );
}
