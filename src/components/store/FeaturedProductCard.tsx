import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

interface FeaturedProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    compare_at_price: number | null;
    images: string[];
    category: string | null;
  };
  isNew?: boolean;
}

export function FeaturedProductCard({ product, isNew }: FeaturedProductCardProps) {
  const { addItem } = useCart();

  const imageUrl = product.images.length > 0 ? product.images[0] : "/placeholder.svg";
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.compare_at_price || undefined,
      image: imageUrl,
    });
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isNew && (
            <Badge className="bg-store-highlight text-store-primary-foreground">New</Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-store-secondary text-store-primary-foreground">
              {discount}% OFF
            </Badge>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full bg-store-primary hover:bg-store-primary/90"
            onClick={handleQuickAdd}
          >
            Quick Add
          </Button>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{product.category || "Uncategorized"}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-foreground">৳{product.price.toLocaleString()}</span>
          {product.compare_at_price && (
            <span className="text-sm text-muted-foreground line-through">
              ৳{product.compare_at_price.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
