import { useState, useMemo } from "react";
import type { SortDirection } from "@/components/ui/sortable-table-head";

interface UseSortingOptions<T> {
  initialSortKey?: keyof T | null;
  initialDirection?: SortDirection;
}

export function useSorting<T>(
  data: T[],
  options: UseSortingOptions<T> = {}
) {
  const { initialSortKey = null, initialDirection = null } = options;
  const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  const handleSort = (key: string) => {
    const typedKey = key as keyof T;
    if (sortKey === typedKey) {
      // Toggle direction: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      setSortKey(typedKey);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? -1 : 1;
      if (bValue == null) return sortDirection === "asc" ? 1 : -1;

      // Compare values
      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  return {
    sortedData,
    sortKey: sortKey as string | null,
    sortDirection,
    handleSort,
  };
}
