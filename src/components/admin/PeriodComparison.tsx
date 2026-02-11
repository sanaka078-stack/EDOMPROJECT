import { ArrowUp, ArrowDown, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format: "currency" | "number" | "percent";
}

interface PeriodComparisonProps {
  metrics: ComparisonMetric[];
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  loading?: boolean;
}

export function PeriodComparison({
  metrics,
  currentPeriodLabel,
  previousPeriodLabel,
  loading = false,
}: PeriodComparisonProps) {
  const formatValue = (value: number, format: "currency" | "number" | "percent") => {
    switch (format) {
      case "currency":
        return `৳${value.toLocaleString()}`;
      case "percent":
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card animate-pulse">
        <div className="h-5 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-6 w-16 bg-muted rounded" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
          Period Comparison
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-primary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {currentPeriodLabel}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-muted" />
            {previousPeriodLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const change = calculateChange(metric.current, metric.previous);
          const isPositive = change > 0;
          const isNeutral = change === 0;

          return (
            <div key={metric.label} className="space-y-1">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-foreground">
                  {formatValue(metric.current, metric.format)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  vs {formatValue(metric.previous, metric.format)}
                </span>
                <span className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  isPositive && "text-success",
                  !isPositive && !isNeutral && "text-destructive",
                  isNeutral && "text-muted-foreground"
                )}>
                  {isNeutral ? (
                    <Minus className="h-3 w-3" />
                  ) : isPositive ? (
                    <ArrowUp className="h-3 w-3" />
                  ) : (
                    <ArrowDown className="h-3 w-3" />
                  )}
                  {Math.abs(change).toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
