import { useState, useEffect } from "react";
import { Target, TrendingUp, TrendingDown, Edit2, Check, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  type: "currency" | "number";
}

interface GoalTrackerProps {
  salesGoal?: number;
  ordersGoal?: number;
  customersGoal?: number;
  currentSales: number;
  currentOrders: number;
  currentCustomers: number;
  loading?: boolean;
  onGoalsChange?: (goals: { sales: number; orders: number; customers: number }) => void;
}

export function GoalTracker({
  salesGoal = 100000,
  ordersGoal = 50,
  customersGoal = 20,
  currentSales,
  currentOrders,
  currentCustomers,
  loading = false,
  onGoalsChange,
}: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  useEffect(() => {
    setGoals([
      {
        id: "sales",
        label: "Monthly Sales",
        current: currentSales,
        target: salesGoal,
        unit: "৳",
        type: "currency",
      },
      {
        id: "orders",
        label: "Monthly Orders",
        current: currentOrders,
        target: ordersGoal,
        unit: "",
        type: "number",
      },
      {
        id: "customers",
        label: "New Customers",
        current: currentCustomers,
        target: customersGoal,
        unit: "",
        type: "number",
      },
    ]);
  }, [currentSales, currentOrders, currentCustomers, salesGoal, ordersGoal, customersGoal]);

  const handleEditStart = (goal: Goal) => {
    setEditingId(goal.id);
    setEditValue(goal.target.toString());
  };

  const handleEditSave = (goalId: string) => {
    const newTarget = parseInt(editValue) || 0;
    if (newTarget > 0) {
      setGoals(prev => prev.map(g => 
        g.id === goalId ? { ...g, target: newTarget } : g
      ));
      
      if (onGoalsChange) {
        const updatedGoals = goals.reduce((acc, g) => ({
          ...acc,
          [g.id]: g.id === goalId ? newTarget : g.target,
        }), {} as { sales: number; orders: number; customers: number });
        onGoalsChange(updatedGoals);
      }
    }
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  const formatValue = (value: number, type: "currency" | "number", unit: string) => {
    if (type === "currency") {
      return `${unit}${value.toLocaleString()}`;
    }
    return `${value}${unit}`;
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card">
        <div className="mb-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-display text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Goals & Targets
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">This month's progress</p>
        </div>
      </div>

      <div className="space-y-5">
        {goals.map((goal) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100);
          const isAchieved = goal.current >= goal.target;
          const isEditing = editingId === goal.id;

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{goal.label}</span>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-24 text-xs"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleEditSave(goal.id)}
                      >
                        <Check className="h-3 w-3 text-success" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleEditCancel}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {formatValue(goal.current, goal.type, goal.unit)} / {formatValue(goal.target, goal.type, goal.unit)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEditStart(goal)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2",
                    isAchieved && "[&>div]:bg-success"
                  )}
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={cn(
                    "text-xs font-medium",
                    isAchieved ? "text-success" : "text-muted-foreground"
                  )}>
                    {percentage.toFixed(0)}%
                  </span>
                  {isAchieved ? (
                    <span className="text-xs text-success flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Goal achieved!
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {formatValue(goal.target - goal.current, goal.type, goal.unit)} to go
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
