import { useState, useMemo } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
) {
  const { initialPage = 1, initialPageSize = 10 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to first page if current page is out of bounds
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const paginatedData = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return data.slice(start, end);
  }, [data, safePage, pageSize]);

  const goToPage = (page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return {
    paginatedData,
    currentPage: safePage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  };
}
