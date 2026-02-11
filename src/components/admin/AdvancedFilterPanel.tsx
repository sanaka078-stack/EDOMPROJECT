import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  priority: string;
  category: string;
  status: string;
  searchQuery: string;
  responseTimeFilter: "all" | "under_1h" | "1h_24h" | "over_24h" | "no_response";
}

interface AdvancedFilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories?: string[];
  statuses?: { value: string; label: string }[];
  priorities?: { value: string; label: string }[];
  showResponseTimeFilter?: boolean;
}

export function AdvancedFilterPanel({
  filters,
  onFiltersChange,
  categories = [],
  statuses = [],
  priorities = [
    { value: "low", label: "কম" },
    { value: "medium", label: "মাঝারি" },
    { value: "high", label: "উচ্চ" },
    { value: "urgent", label: "জরুরি" },
  ],
  showResponseTimeFilter = false,
}: AdvancedFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = [
    filters.dateFrom,
    filters.dateTo,
    filters.priority !== "all",
    filters.category !== "all",
    filters.status !== "all",
    filters.responseTimeFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({
      dateFrom: undefined,
      dateTo: undefined,
      priority: "all",
      category: "all",
      status: "all",
      searchQuery: filters.searchQuery,
      responseTimeFilter: "all",
    });
  };

  const updateFilter = (key: keyof FilterState, value: FilterState[keyof FilterState]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="নাম, ইমেইল বা বিষয় খুঁজুন..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Toggle */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              অ্যাডভান্সড ফিল্টার
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              ফিল্টার মুছুন
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Date From */}
                <div className="space-y-2">
                  <Label className="text-sm">তারিখ থেকে</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? (
                          format(filters.dateFrom, "d MMM yyyy", { locale: bn })
                        ) : (
                          "তারিখ নির্বাচন করুন"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => updateFilter("dateFrom", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label className="text-sm">তারিখ পর্যন্ত</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? (
                          format(filters.dateTo, "d MMM yyyy", { locale: bn })
                        ) : (
                          "তারিখ নির্বাচন করুন"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => updateFilter("dateTo", date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Priority Filter */}
                {priorities.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">প্রায়োরিটি</Label>
                    <Select
                      value={filters.priority}
                      onValueChange={(value) => updateFilter("priority", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব প্রায়োরিটি" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব প্রায়োরিটি</SelectItem>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Status Filter */}
                {statuses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">স্ট্যাটাস</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => updateFilter("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব স্ট্যাটাস" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব স্ট্যাটাস</SelectItem>
                        {statuses.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">ক্যাটাগরি</Label>
                    <Select
                      value={filters.category}
                      onValueChange={(value) => updateFilter("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব ক্যাটাগরি" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব ক্যাটাগরি</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Response Time Filter */}
                {showResponseTimeFilter && (
                  <div className="space-y-2">
                    <Label className="text-sm">রেসপন্স টাইম</Label>
                    <Select
                      value={filters.responseTimeFilter}
                      onValueChange={(value) => updateFilter("responseTimeFilter", value as FilterState["responseTimeFilter"])}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="সব রেসপন্স টাইম" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">সব</SelectItem>
                        <SelectItem value="under_1h">১ ঘণ্টার কম</SelectItem>
                        <SelectItem value="1h_24h">১-২৪ ঘণ্টা</SelectItem>
                        <SelectItem value="over_24h">২৪ ঘণ্টার বেশি</SelectItem>
                        <SelectItem value="no_response">উত্তর দেওয়া হয়নি</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              থেকে: {format(filters.dateFrom, "d MMM", { locale: bn })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("dateFrom", undefined)}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              পর্যন্ত: {format(filters.dateTo, "d MMM", { locale: bn })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("dateTo", undefined)}
              />
            </Badge>
          )}
          {filters.priority !== "all" && (
            <Badge variant="secondary" className="gap-1">
              প্রায়োরিটি: {priorities.find((p) => p.value === filters.priority)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("priority", "all")}
              />
            </Badge>
          )}
          {filters.status !== "all" && (
            <Badge variant="secondary" className="gap-1">
              স্ট্যাটাস: {statuses.find((s) => s.value === filters.status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("status", "all")}
              />
            </Badge>
          )}
          {filters.responseTimeFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              রেসপন্স: {
                filters.responseTimeFilter === "under_1h" ? "১ ঘণ্টার কম" :
                filters.responseTimeFilter === "1h_24h" ? "১-২৪ ঘণ্টা" :
                filters.responseTimeFilter === "over_24h" ? "২৪ ঘণ্টার বেশি" :
                "উত্তর দেওয়া হয়নি"
              }
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => updateFilter("responseTimeFilter", "all")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component to highlight search terms
export function HighlightedText({ text, searchQuery }: { text: string; searchQuery: string }) {
  if (!searchQuery.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
