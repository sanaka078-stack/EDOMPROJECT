import { Link } from "react-router-dom";
import { ShoppingBag, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  compare_price: number | null;
  image_url: string | null;
  category: string | null;
  stock: number;
}

interface StoreProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export function StoreProductCard({ product, viewMode = "grid" }: StoreProductCardProps) {
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.compare_price || undefined,
      image: product.image_url || "/placeholder.svg",
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  const discount = product.compare_price 
    ? Math.round((1 - product.price / product.compare_price) * 100)
    : 0;

  if (viewMode === "list") {
    return (
      <Card className="overflow-hidden">
        <div className="flex">
          <Link to={`/product/${product.id}`} className="relative w-32 sm:w-48 flex-shrink-0">
            <img
              src={product.image_url || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover aspect-square"
            />
            {discount > 0 && (
              <Badge className="absolute top-2 left-2 bg-store-secondary text-store-primary-foreground">
                {discount}% OFF
              </Badge>
            )}
          </Link>
          <CardContent className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
              <Link to={`/product/${product.id}`}>
                <h3 className="font-medium text-foreground hover:text-store-primary transition-colors">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-bold text-foreground">৳{product.price.toLocaleString()}</span>
                {product.compare_price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ৳{product.compare_price.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                className="flex-1 bg-store-primary hover:bg-store-primary/90"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleWishlistToggle}
                className={inWishlist ? "text-store-secondary" : ""}
              >
                <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {discount > 0 && (
            <Badge className="absolute top-3 left-3 bg-store-secondary text-store-primary-foreground">
              {discount}% OFF
            </Badge>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
            </div>
          )}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="secondary" 
              size="icon" 
              className={cn(
                "rounded-full bg-store-card/90 backdrop-blur-sm",
                inWishlist && "text-store-secondary"
              )}
              onClick={handleWishlistToggle}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </Button>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button 
              className="w-full bg-store-primary hover:bg-store-primary/90"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        </div>
      </Link>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-foreground">৳{product.price.toLocaleString()}</span>
          {product.compare_price && (
            <span className="text-sm text-muted-foreground line-through">
              ৳{product.compare_price.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
