import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, Eye, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "./ProductCard";
import { TablePagination } from "@/components/ui/table-pagination";
import { SortableTableHead, type SortDirection } from "@/components/ui/sortable-table-head";
import { useSorting } from "@/hooks/useSorting";

interface ProductTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onView: (product: Product) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function ProductTable({
  products,
  selectedProducts,
  onSelectProduct,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: ProductTableProps) {
  // Sorting
  const { sortedData, sortKey, sortDirection, handleSort } = useSorting(products);
  const getStatusColor = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return "bg-success/10 text-success border-success/20";
      case "draft":
        return "bg-warning/10 text-warning border-warning/20";
      case "archived":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStockColor = (stock: number) => {
    if (stock === 0) return "text-destructive";
    if (stock <= 10) return "text-warning";
    return "text-success";
  };

  const allSelected = sortedData.length > 0 && selectedProducts.length === sortedData.length;
  const someSelected = selectedProducts.length > 0 && selectedProducts.length < sortedData.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                // @ts-ignore
                indeterminate={someSelected}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <SortableTableHead
              sortKey="name"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
              className="min-w-[250px]"
            >
              Product
            </SortableTableHead>
            <SortableTableHead
              sortKey="sku"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            >
              SKU
            </SortableTableHead>
            <SortableTableHead
              sortKey="category"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            >
              Category
            </SortableTableHead>
            <SortableTableHead
              sortKey="price"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
              className="text-right"
            >
              Price
            </SortableTableHead>
            <SortableTableHead
              sortKey="stock"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
              className="text-center"
            >
              Stock
            </SortableTableHead>
            <SortableTableHead
              sortKey="status"
              currentSortKey={sortKey}
              currentDirection={sortDirection}
              onSort={handleSort}
            >
              Status
            </SortableTableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Checkbox
                  checked={selectedProducts.includes(product.id)}
                  onCheckedChange={() => onSelectProduct(product.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-lg bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    {product.sizes && product.sizes.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {product.sizes.slice(0, 3).join(", ")}
                        {product.sizes.length > 3 && ` +${product.sizes.length - 3}`}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {product.sku}
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell className="text-right">
                <div>
                  <p className="font-medium">৳{product.price.toLocaleString()}</p>
                  {product.comparePrice && (
                    <p className="text-xs text-muted-foreground line-through">
                      ৳{product.comparePrice.toLocaleString()}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className={cn("font-medium", getStockColor(product.stock))}>
                    {product.stock}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("capitalize", getStatusColor(product.status))}
                >
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => onView(product)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalItems > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
