import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { ShoppingCart, Package, Users, TrendingUp, AlertCircle, Clock, RefreshCw } from "lucide-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { StatsCard } from "@/components/admin/StatsCard";
import { RecentOrders } from "@/components/admin/RecentOrders";
import { SalesChart } from "@/components/admin/SalesChart";
import { TopProducts } from "@/components/admin/TopProducts";
import { QuickActions } from "@/components/admin/QuickActions";
import { DateRangeSelector, DateRangePreset } from "@/components/admin/DateRangeSelector";
import { ActivityFeed } from "@/components/admin/ActivityFeed";
import { GoalTracker } from "@/components/admin/GoalTracker";
import { PeriodComparison } from "@/components/admin/PeriodComparison";
import { DashboardWidget } from "@/components/admin/DashboardWidget";
import { DashboardWidgetPicker } from "@/components/admin/DashboardWidgetPicker";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useDashboardLayout } from "@/hooks/useDashboardLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const Index = () => {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last30days");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | undefined>();
  
  const { 
    stats, 
    recentOrders, 
    topProducts, 
    salesData, 
    loading, 
    refetch,
    dateRange,
  } = useDashboardData(dateRangePreset, customRange);
  
  const {
    widgets,
    visibleWidgets,
    moveWidget,
    removeWidget,
    addWidget,
    resetLayout,
  } = useDashboardLayout();
  
  const { t } = useLanguage();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      moveWidget(active.id as string, over.id as string);
    }
  };

  const handleDateRangeChange = (preset: DateRangePreset, range?: { from: Date; to: Date }) => {
    setDateRangePreset(preset);
    if (range) {
      setCustomRange(range);
    }
  };

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-BD')}`;
  };

  const statsData = [
    { 
      title: t('dashboard.totalSales'), 
      value: formatCurrency(stats.totalSales), 
      change: stats.salesChange, 
      icon: TrendingUp, 
      iconBg: "accent" as const 
    },
    { 
      title: t('dashboard.totalOrders'), 
      value: stats.totalOrders.toString(), 
      change: stats.ordersChange, 
      icon: ShoppingCart, 
      iconBg: "primary" as const 
    },
    { 
      title: t('dashboard.totalProducts'), 
      value: stats.totalProducts.toString(), 
      change: stats.productsChange, 
      icon: Package, 
      iconBg: "warning" as const 
    },
    { 
      title: t('dashboard.totalCustomers'), 
      value: stats.totalCustomers.toString(), 
      change: stats.customersChange, 
      icon: Users, 
      iconBg: "success" as const 
    },
  ];

  const comparisonMetrics = [
    {
      label: "Sales",
      current: stats.monthlySales,
      previous: stats.previousSales,
      format: "currency" as const,
    },
    {
      label: "Orders",
      current: stats.monthlyOrders,
      previous: stats.previousOrders,
      format: "number" as const,
    },
    {
      label: "Customers",
      current: stats.monthlyCustomers,
      previous: stats.previousCustomers,
      format: "number" as const,
    },
    {
      label: "Avg. Order",
      current: stats.monthlyOrders > 0 ? stats.monthlySales / stats.monthlyOrders : 0,
      previous: stats.previousOrders > 0 ? stats.previousSales / stats.previousOrders : 0,
      format: "currency" as const,
    },
  ];

  const renderWidget = (widget: typeof visibleWidgets[0]) => {
    switch (widget.type) {
      case "alerts":
        if (stats.pendingOrders === 0 && stats.lowStockProducts === 0) return null;
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {stats.pendingOrders > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <Clock className="h-5 w-5 text-warning" />
                  <span className="text-sm font-medium">{stats.pendingOrders} pending orders need attention</span>
                </div>
              )}
              {stats.lowStockProducts > 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">{stats.lowStockProducts} products are low on stock</span>
                </div>
              )}
            </div>
          </DashboardWidget>
        );

      case "stats":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-4"
          >
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-28 rounded-lg" />
                ))
              ) : (
                statsData.map((stat) => (
                  <StatsCard key={stat.title} {...stat} />
                ))
              )}
            </div>
          </DashboardWidget>
        );

      case "periodComparison":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-4"
          >
            <PeriodComparison
              metrics={comparisonMetrics}
              currentPeriodLabel={`${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`}
              previousPeriodLabel="Previous period"
              loading={loading}
            />
          </DashboardWidget>
        );

      case "salesChart":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-2"
          >
            <SalesChart data={salesData} loading={loading} />
          </DashboardWidget>
        );

      case "goalTracker":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-1"
          >
            <GoalTracker
              currentSales={stats.monthlySales}
              currentOrders={stats.monthlyOrders}
              currentCustomers={stats.monthlyCustomers}
              salesGoal={100000}
              ordersGoal={50}
              customersGoal={20}
              loading={loading}
            />
          </DashboardWidget>
        );

      case "activityFeed":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-1"
          >
            <ActivityFeed limit={8} />
          </DashboardWidget>
        );

      case "topProducts":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-1"
          >
            <TopProducts products={topProducts} loading={loading} />
          </DashboardWidget>
        );

      case "recentOrders":
        return (
          <DashboardWidget
            key={widget.id}
            id={widget.id}
            title={widget.title}
            onRemove={() => removeWidget(widget.id)}
            className="lg:col-span-3"
          >
            <RecentOrders orders={recentOrders} loading={loading} />
          </DashboardWidget>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{t('dashboard.welcome')}! Drag widgets to rearrange your dashboard.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeSelector
              value={dateRangePreset}
              customRange={customRange}
              onChange={handleDateRangeChange}
            />
            <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DashboardWidgetPicker
              widgets={widgets}
              onAddWidget={addWidget}
              onResetLayout={resetLayout}
            />
            <QuickActions onRefresh={refetch} loading={loading} />
          </div>
        </div>
      </div>

      {/* Draggable Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-4">
            {visibleWidgets.map((widget) => renderWidget(widget))}
          </div>
        </SortableContext>
      </DndContext>
    </AdminLayout>
  );
};

export default Index;
