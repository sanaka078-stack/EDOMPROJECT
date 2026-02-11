import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

export type DateRangePreset = 
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "last3months"
  | "thisYear"
  | "custom";

interface DateRangeSelectorProps {
  value: DateRangePreset;
  customRange?: { from: Date; to: Date };
  onChange: (preset: DateRangePreset, customRange?: { from: Date; to: Date }) => void;
}

const presetLabels: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  thisMonth: "This Month",
  lastMonth: "Last Month",
  last3months: "Last 3 Months",
  thisYear: "This Year",
  custom: "Custom Range",
};

export function getDateRangeFromPreset(preset: DateRangePreset, customRange?: { from: Date; to: Date }): { from: Date; to: Date } {
  const now = new Date();
  
  switch (preset) {
    case "today":
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { 
        from: new Date(yesterday.setHours(0, 0, 0, 0)), 
        to: new Date(yesterday.setHours(23, 59, 59, 999)) 
      };
    case "last7days":
      return { from: subDays(now, 7), to: now };
    case "last30days":
      return { from: subDays(now, 30), to: now };
    case "thisMonth":
      return { from: startOfMonth(now), to: now };
    case "lastMonth":
      const lastMonth = subMonths(now, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    case "last3months":
      return { from: subMonths(now, 3), to: now };
    case "thisYear":
      return { from: startOfYear(now), to: now };
    case "custom":
      return customRange || { from: subDays(now, 30), to: now };
    default:
      return { from: subDays(now, 30), to: now };
  }
}

export function DateRangeSelector({ value, customRange, onChange }: DateRangeSelectorProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(
    customRange ? { from: customRange.from, to: customRange.to } : undefined
  );

  const handlePresetSelect = (preset: DateRangePreset) => {
    if (preset === "custom") {
      setIsCustomOpen(true);
    } else {
      onChange(preset);
    }
  };

  const handleCustomApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onChange("custom", { from: tempRange.from, to: tempRange.to });
      setIsCustomOpen(false);
    }
  };

  const displayLabel = value === "custom" && customRange
    ? `${format(customRange.from, "MMM d")} - ${format(customRange.to, "MMM d, yyyy")}`
    : presetLabels[value];

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">{displayLabel}</span>
            <span className="sm:hidden">
              {value === "custom" ? "Custom" : presetLabels[value].split(" ")[0]}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {(Object.keys(presetLabels) as DateRangePreset[])
            .filter(p => p !== "custom")
            .map((preset) => (
              <DropdownMenuItem
                key={preset}
                onClick={() => handlePresetSelect(preset)}
                className={cn(value === preset && "bg-accent")}
              >
                {presetLabels[preset]}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePresetSelect("custom")}>
            Custom Range...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <span className="hidden" />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm">Select Date Range</h4>
          </div>
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from}
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={2}
            className="p-3"
          />
          <div className="flex items-center justify-end gap-2 p-3 border-t">
            <Button variant="outline" size="sm" onClick={() => setIsCustomOpen(false)}>
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleCustomApply}
              disabled={!tempRange?.from || !tempRange?.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
