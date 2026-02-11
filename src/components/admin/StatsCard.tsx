import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconBg?: "primary" | "accent" | "success" | "warning";
}

const iconBgClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function StatsCard({ title, value, change, icon: Icon, iconBg = "primary" }: StatsCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card transition-all hover:shadow-md animate-fade-in">
      <div className="flex items-start justify-between">
        <div className={cn("rounded-lg p-2 sm:p-3", iconBgClasses[iconBg])}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
          isPositive 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-3 sm:mt-4">
        <h3 className="text-xl sm:text-2xl font-bold text-foreground">{value}</h3>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
