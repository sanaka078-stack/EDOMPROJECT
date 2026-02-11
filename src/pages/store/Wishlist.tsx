import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StoreLayout } from '@/layouts/StoreLayout';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Wishlist() {
  const { items, loading, removeItem } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (item: typeof items[0]) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg';
    addToCart({
      id: item.product_id,
      name: item.name,
      price: item.price,
      comparePrice: item.compare_at_price || undefined,
      image: imageUrl,
    });
    toast.success('Added to cart');
  };

  const handleRemove = async (productId: string) => {
    await removeItem(productId);
  };

  if (!user) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <Heart className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">Login to view your wishlist</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Sign in to save your favorite products and access them anytime.
          </p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild>
            <Link to="/store/login">Sign In</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  if (loading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-store-primary" />
          <p className="mt-4 text-muted-foreground">Loading your wishlist...</p>
        </div>
      </StoreLayout>
    );
  }

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-store-muted flex items-center justify-center">
            <Heart className="w-16 h-16 text-muted-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-3">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Browse our products and click the heart icon to save items you love.
          </p>
          <Button size="lg" className="bg-store-primary hover:bg-store-primary/90" asChild>
            <Link to="/store/products">Browse Products</Link>
          </Button>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      {/* Page Header */}
      <section className="bg-gradient-to-r from-store-primary to-store-secondary py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-store-primary-foreground">
            My Wishlist
          </h1>
          <p className="text-store-primary-foreground/80 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const discount = item.compare_at_price
              ? Math.round((1 - item.price / item.compare_at_price) * 100)
              : 0;
            const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '/placeholder.svg';

            return (
              <Card key={item.id} className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300">
                <Link to={`/product/${item.product_id}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {discount > 0 && (
                      <Badge className="absolute top-3 left-3 bg-store-secondary text-store-primary-foreground">
                        {discount}% OFF
                      </Badge>
                    )}
                    {item.quantity === 0 && (
                      <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                        <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                  <Link to={`/product/${item.product_id}`}>
                    <h3 className="font-medium text-foreground hover:text-store-primary transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-foreground">৳{item.price.toLocaleString()}</span>
                    {item.compare_at_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ৳{item.compare_at_price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1 bg-store-primary hover:bg-store-primary/90"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.quantity === 0}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </StoreLayout>
  );
}
