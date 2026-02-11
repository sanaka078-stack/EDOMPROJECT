import { Plus, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  visible: boolean;
  order: number;
  span?: number; // Grid column span
}

interface DashboardWidgetPickerProps {
  widgets: WidgetConfig[];
  onAddWidget: (type: string) => void;
  onResetLayout: () => void;
}

const availableWidgets = [
  { type: "stats", title: "Stats Cards", description: "Key performance metrics" },
  { type: "salesChart", title: "Sales Chart", description: "Monthly sales overview" },
  { type: "goalTracker", title: "Goal Tracker", description: "Monthly targets progress" },
  { type: "activityFeed", title: "Activity Feed", description: "Recent store events" },
  { type: "topProducts", title: "Top Products", description: "Best selling products" },
  { type: "recentOrders", title: "Recent Orders", description: "Latest orders" },
  { type: "periodComparison", title: "Period Comparison", description: "Compare metrics" },
  { type: "alerts", title: "Alerts", description: "Pending orders & low stock" },
];

export function DashboardWidgetPicker({
  widgets,
  onAddWidget,
  onResetLayout,
}: DashboardWidgetPickerProps) {
  const hiddenWidgets = availableWidgets.filter(
    (aw) => !widgets.some((w) => w.type === aw.type && w.visible)
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <LayoutGrid className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add Widget</DropdownMenuLabel>
        {hiddenWidgets.length > 0 ? (
          hiddenWidgets.map((widget) => (
            <DropdownMenuItem
              key={widget.type}
              onClick={() => onAddWidget(widget.type)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <div className="flex flex-col">
                <span>{widget.title}</span>
                <span className="text-xs text-muted-foreground">
                  {widget.description}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            All widgets are visible
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onResetLayout}>
          Reset Layout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { availableWidgets };
