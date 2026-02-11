import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopProduct } from "@/hooks/useDashboardData";

interface TopProductsProps {
  products?: TopProduct[];
  loading?: boolean;
}

export function TopProducts({ products = [], loading = false }: TopProductsProps) {
  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;

  // Calculate max stock for percentage
  const maxStock = products.length > 0 ? Math.max(...products.map(p => p.quantity)) : 100;

  if (loading) {
    return (
      <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card animate-fade-in">
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-5 w-28 mb-2" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-4 sm:space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card p-4 sm:p-6 shadow-card animate-fade-in">
      <div className="mb-4 sm:mb-6">
        <h2 className="font-display text-base sm:text-lg font-semibold text-foreground">Top Products</h2>
        <p className="text-xs sm:text-sm text-muted-foreground">Products with highest stock</p>
      </div>
      {products.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">No products yet</div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {products.map((product, index) => (
            <div key={product.id} className="space-y-2">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="flex h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-sm sm:text-base text-foreground block truncate">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground">{formatCurrency(product.price)}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{product.quantity} in stock</p>
                </div>
              </div>
              <Progress value={(product.quantity / maxStock) * 100} className="h-1.5 sm:h-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
