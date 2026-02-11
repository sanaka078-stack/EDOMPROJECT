import { useState, useEffect, useCallback } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import { WidgetConfig } from "@/components/admin/DashboardWidgetPicker";

const STORAGE_KEY = "dashboard-widget-layout";

const defaultWidgets: WidgetConfig[] = [
  { id: "alerts-1", type: "alerts", title: "Alerts", visible: true, order: 0 },
  { id: "stats-1", type: "stats", title: "Stats Cards", visible: true, order: 1 },
  { id: "periodComparison-1", type: "periodComparison", title: "Period Comparison", visible: true, order: 2 },
  { id: "salesChart-1", type: "salesChart", title: "Sales Chart", visible: true, order: 3, span: 2 },
  { id: "goalTracker-1", type: "goalTracker", title: "Goal Tracker", visible: true, order: 4 },
  { id: "activityFeed-1", type: "activityFeed", title: "Activity Feed", visible: true, order: 5 },
  { id: "topProducts-1", type: "topProducts", title: "Top Products", visible: true, order: 6 },
  { id: "recentOrders-1", type: "recentOrders", title: "Recent Orders", visible: true, order: 7, span: 2 },
];

export function useDashboardLayout() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new widgets
        const mergedWidgets = defaultWidgets.map((dw) => {
          const saved = parsed.find((p: WidgetConfig) => p.type === dw.type);
          return saved ? { ...dw, ...saved } : dw;
        });
        return mergedWidgets.sort((a, b) => a.order - b.order);
      }
    } catch (e) {
      console.error("Failed to load dashboard layout:", e);
    }
    return defaultWidgets;
  });

  // Save to localStorage whenever widgets change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch (e) {
      console.error("Failed to save dashboard layout:", e);
    }
  }, [widgets]);

  const moveWidget = useCallback((activeId: string, overId: string) => {
    setWidgets((items) => {
      const oldIndex = items.findIndex((i) => i.id === activeId);
      const newIndex = items.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return items;
      const newItems = arrayMove(items, oldIndex, newIndex);
      return newItems.map((item, index) => ({ ...item, order: index }));
    });
  }, []);

  const removeWidget = useCallback((id: string) => {
    setWidgets((items) =>
      items.map((item) =>
        item.id === id ? { ...item, visible: false } : item
      )
    );
  }, []);

  const addWidget = useCallback((type: string) => {
    setWidgets((items) => {
      const existingWidget = items.find((w) => w.type === type);
      if (existingWidget) {
        return items.map((item) =>
          item.id === existingWidget.id ? { ...item, visible: true } : item
        );
      }
      const widgetInfo = defaultWidgets.find((w) => w.type === type);
      if (!widgetInfo) return items;
      return [
        ...items,
        {
          ...widgetInfo,
          id: `${type}-${Date.now()}`,
          visible: true,
          order: items.length,
        },
      ];
    });
  }, []);

  const resetLayout = useCallback(() => {
    setWidgets(defaultWidgets);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const visibleWidgets = widgets
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order);

  return {
    widgets,
    visibleWidgets,
    moveWidget,
    removeWidget,
    addWidget,
    resetLayout,
  };
}
