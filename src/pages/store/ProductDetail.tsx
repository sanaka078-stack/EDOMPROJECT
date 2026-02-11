import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Minus, Plus, Heart, Share2, Truck, RefreshCw, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { StoreLayout } from "@/layouts/StoreLayout";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductReviews } from "@/components/store/ProductReviews";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  category: string | null;
  quantity: number;
  sku: string | null;
}

const sizes = ["S", "M", "L", "XL", "XXL"];
const colors = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Red", value: "#dc2626" },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleWishlistToggle = () => {
    if (!product) return;
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, compare_at_price, images, category, quantity, sku")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct({
        id: data.id,
        name: data.name,
        description: data.description,
        price: Number(data.price),
        compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
        images: data.images || [],
        category: data.category,
        quantity: data.quantity,
        sku: data.sku,
      });
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    const imageUrl = product.images.length > 0 ? product.images[0] : "/placeholder.svg";

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      comparePrice: product.compare_at_price || undefined,
      image: imageUrl,
      size: selectedSize,
      color: selectedColor || undefined,
    }, quantity);

    toast.success("Added to cart!");
  };

  const discount = product?.compare_at_price 
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : 0;

  const imageUrl = product?.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg";

  if (loading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-muted rounded w-1/4 animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* Breadcrumb */}
      <div className="bg-store-muted py-3">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-store-primary transition-colors">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-store-primary transition-colors">Products</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount > 0 && (
              <Badge className="absolute top-4 left-4 bg-store-secondary text-store-primary-foreground text-lg px-3 py-1">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">
                ৳{product.price.toLocaleString()}
              </span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through">
                  ৳{product.compare_at_price.toLocaleString()}
                </span>
              )}
              {discount > 0 && (
                <Badge className="bg-store-accent text-store-accent-foreground">
                  Save ৳{(product.compare_at_price! - product.price).toLocaleString()}
                </Badge>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {product.quantity > 0 ? (
                <Badge variant="outline" className="text-success border-success">
                  In Stock ({product.quantity} available)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-destructive border-destructive">
                  Out of Stock
                </Badge>
              )}
            </div>

            <Separator className="my-6" />

            {/* Size Selection */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Size</h4>
                <Link to="/size-guide" className="text-sm text-store-primary hover:underline">
                  Size Guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    className={selectedSize === size ? "bg-store-primary hover:bg-store-primary/90" : ""}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Color</h4>
              <div className="flex gap-3">
                {colors.map((color) => (
                  <button
                    key={color.name}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.name 
                        ? "border-store-primary scale-110" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.name)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Quantity</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                    disabled={quantity >= product.quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <Button
                size="lg"
                className="flex-1 bg-store-primary hover:bg-store-primary/90"
                onClick={handleAddToCart}
                disabled={product.quantity === 0}
              >
                Add to Cart
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleWishlistToggle}
                className={inWishlist ? "text-store-secondary" : ""}
              >
                <Heart className={cn("h-5 w-5", inWishlist && "fill-current")} />
              </Button>
              <Button size="lg" variant="outline">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-store-muted rounded-lg">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-store-primary" />
                <p className="text-xs font-medium">Free Shipping</p>
              </div>
              <div className="text-center">
                <RefreshCw className="h-6 w-6 mx-auto mb-2 text-store-primary" />
                <p className="text-xs font-medium">7-Day Returns</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-store-primary" />
                <p className="text-xs font-medium">Secure Payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
              <TabsTrigger 
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-store-primary data-[state=active]:bg-transparent"
              >
                Description
              </TabsTrigger>
              <TabsTrigger 
                value="details"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-store-primary data-[state=active]:bg-transparent"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-store-primary data-[state=active]:bg-transparent"
              >
                Reviews
              </TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="py-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground">
                  {product.description || "No description available for this product."}
                </p>
              </div>
            </TabsContent>
            <TabsContent value="details" className="py-6">
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Category:</strong> {product.category || "N/A"}</li>
                <li><strong>SKU:</strong> {product.sku || "N/A"}</li>
                <li><strong>Material:</strong> Premium Cotton Blend</li>
                <li><strong>Care:</strong> Machine wash cold, tumble dry low</li>
              </ul>
            </TabsContent>
            <TabsContent value="reviews" className="py-6">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StoreLayout>
  );
}
