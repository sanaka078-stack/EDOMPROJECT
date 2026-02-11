import { useState, useMemo } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductFilters, type FilterState } from "@/components/products/ProductFilters";
import { ProductModal } from "@/components/products/ProductModal";
import { ProductViewModal } from "@/components/products/ProductViewModal";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductImportExport } from "@/components/products/ProductImportExport";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { Plus, Package, Trash2 } from "lucide-react";
import { useProductsData, type Product } from "@/hooks/useProductsData";
import { useCategoriesData } from "@/hooks/useCategoriesData";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";

// Adapter type for the ProductCard component
interface ProductCardData {
  id: string;
  name: string;
  sku: string;
  price: number;
  comparePrice?: number;
  stock: number;
  category: string;
  status: "active" | "draft" | "archived";
  image: string;
  sizes?: string[];
  colors?: string[];
}

export default function Products() {
  const { products, loading, createProduct, updateProduct, deleteProduct, bulkDelete, bulkImport } = useProductsData();
  const { categories: dbCategories, loading: categoriesLoading } = useCategoriesData();
  
  // Get category names from categories table
  const categories = useMemo(() => dbCategories.map(c => c.name), [dbCategories]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "all",
    status: "all",
    stockStatus: "all",
    priceRange: [0, 50000],
    sortBy: "newest",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductCardData | null>(null);
  const [deleteProductItem, setDeleteProductItem] = useState<ProductCardData | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<ProductCardData | null>(null);

  // Adapter function to convert DB product to UI product
  const toUIProduct = (product: Product): ProductCardData => ({
    id: product.id,
    name: product.name,
    sku: product.sku || '',
    price: Number(product.price),
    comparePrice: product.compare_at_price ? Number(product.compare_at_price) : undefined,
    stock: product.quantity,
    category: product.category || '',
    status: product.is_active ? 'active' : 'draft',
    image: (product.images && product.images.length > 0) ? product.images[0] : '/placeholder.svg',
  });

  // Convert products to UI format
  const uiProducts = useMemo(() => products.map(toUIProduct), [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...uiProducts];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.sku.toLowerCase().includes(search) ||
          p.category.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((p) => p.status === filters.status);
    }

    // Stock status filter
    if (filters.stockStatus !== "all") {
      result = result.filter((p) => {
        if (filters.stockStatus === "out-of-stock") return p.stock === 0;
        if (filters.stockStatus === "low-stock") return p.stock > 0 && p.stock <= 10;
        if (filters.stockStatus === "in-stock") return p.stock > 10;
        return true;
      });
    }

    // Price range filter
    result = result.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Sorting
    switch (filters.sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "stock-low":
        result.sort((a, b) => a.stock - b.stock);
        break;
      case "stock-high":
        result.sort((a, b) => b.stock - a.stock);
        break;
      case "oldest":
        result.reverse();
        break;
      default:
        break;
    }

    return result;
  }, [uiProducts, filters]);

  // Pagination for list view
  const {
    paginatedData: paginatedProducts,
    currentPage,
    pageSize,
    totalPages,
    totalItems,
    goToPage,
    changePageSize,
  } = usePagination(filteredProducts, { initialPageSize: 10 });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleEditProduct = (product: ProductCardData) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const handleSaveProduct = async (productData: Omit<ProductCardData, "id">) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: productData.name,
        sku: productData.sku || null,
        price: productData.price,
        compare_at_price: productData.comparePrice || null,
        quantity: productData.stock,
        category: productData.category || null,
        is_active: productData.status === 'active',
        images: productData.image ? [productData.image] : [],
      });
    } else {
      await createProduct({
        name: productData.name,
        sku: productData.sku || null,
        price: productData.price,
        compare_at_price: productData.comparePrice || null,
        quantity: productData.stock,
        category: productData.category || null,
        is_active: productData.status === 'active',
        images: productData.image ? [productData.image] : [],
        description: null,
      });
    }
  };

  const handleDeleteProduct = (product: ProductCardData) => {
    setDeleteProductItem(product);
  };

  const confirmDelete = async () => {
    if (deleteProductItem) {
      await deleteProduct(deleteProductItem.id);
      setSelectedProducts((prev) => prev.filter((id) => id !== deleteProductItem.id));
      setDeleteProductItem(null);
    }
  };

  const handleViewProduct = (product: ProductCardData) => {
    setViewingProduct(product);
    setViewModalOpen(true);
  };

  const handleSelectProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const handleBulkDelete = async () => {
    await bulkDelete(selectedProducts);
    setSelectedProducts([]);
  };

  const handleImport = async (importedProducts: Omit<ProductCardData, "id">[]) => {
    await bulkImport(importedProducts.map(p => ({
      name: p.name,
      sku: p.sku || null,
      price: p.price,
      compare_at_price: p.comparePrice || null,
      quantity: p.stock,
      category: p.category || null,
      is_active: p.status === 'active',
      images: p.image ? [p.image] : [],
      description: null,
    })));
  };

  if (loading || categoriesLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground">
              Manage your product inventory ({filteredProducts.length} products)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedProducts.length})
              </Button>
            )}
            <ProductImportExport 
              products={uiProducts} 
              onImport={handleImport} 
            />
            <Button onClick={handleAddProduct} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Products */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">No products found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Try adjusting your filters or add a new product
            </p>
            <Button onClick={handleAddProduct} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
                onView={handleViewProduct}
              />
            ))}
          </div>
        ) : (
          <ProductTable
            products={paginatedProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
            onView={handleViewProduct}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
        )}
      </div>

      {/* Add/Edit Modal */}
      <ProductModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
        categories={categories}
      />

      {/* View Details Modal */}
      <ProductViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        product={viewingProduct}
        onEdit={handleEditProduct}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={!!deleteProductItem}
        onOpenChange={() => setDeleteProductItem(null)}
        onConfirm={confirmDelete}
        title="Delete Product"
        itemName={deleteProductItem?.name}
      />
    </AdminLayout>
  );
}
