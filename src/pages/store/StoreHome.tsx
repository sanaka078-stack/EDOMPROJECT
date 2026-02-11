import { Link } from "react-router-dom";
import { ArrowRight, Truck, Shield, RefreshCw, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreLayout } from "@/layouts/StoreLayout";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { FeaturedProductCard } from "@/components/store/FeaturedProductCard";
import { FeaturedProductsSkeleton } from "@/components/store/FeaturedProductsSkeleton";

const categories = [
  { name: "Men's Collection", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&h=400&fit=crop", href: "/products?category=men" },
  { name: "Women's Collection", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop", href: "/products?category=women" },
  { name: "New Arrivals", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop", href: "/products?filter=new" },
];

const features = [
  { icon: Truck, title: "Free Shipping", desc: "On orders over ৳2,000" },
  { icon: Shield, title: "Secure Payment", desc: "100% protected" },
  { icon: RefreshCw, title: "Easy Returns", desc: "7-day return policy" },
  { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
];

export default function StoreHome() {
  const { products, loading, isNewProduct } = useFeaturedProducts(4);

  return (
    <StoreLayout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-store-primary via-store-secondary to-store-primary opacity-90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop')] bg-cover bg-center mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-store-primary-foreground">
            <Badge className="mb-4 bg-store-accent text-store-accent-foreground px-4 py-1">
              New Collection 2024
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Elevate Your
              <span className="block text-store-accent">Style Game</span>
            </h1>
            <p className="text-lg md:text-xl mb-8 text-store-primary-foreground/90">
              Discover premium fashion that speaks to your unique personality. 
              Quality fabrics, bold designs, affordable prices.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-store-accent text-store-accent-foreground hover:bg-store-accent/90 font-semibold px-8"
                asChild
              >
                <Link to="/products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-store-primary-foreground text-store-primary-foreground hover:bg-store-primary-foreground/10"
                asChild
              >
                <Link to="/products?filter=new">View New Arrivals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-store-card py-6 border-b border-store-muted">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-store-muted flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-store-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{feature.title}</p>
                  <p className="text-muted-foreground text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-store-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Shop by Category
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Browse our carefully curated collections for every occasion
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {categories.map((cat) => (
              <Link key={cat.name} to={cat.href} className="group relative overflow-hidden rounded-2xl aspect-[3/2]">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-xl md:text-2xl font-bold text-background mb-2">
                    {cat.name}
                  </h3>
                  <span className="inline-flex items-center text-store-accent font-medium group-hover:gap-3 transition-all">
                    Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-store-muted">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Featured Products
              </h2>
              <p className="text-muted-foreground">Handpicked favorites just for you</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/products">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {loading ? (
            <FeaturedProductsSkeleton />
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured products available.</p>
              <Button asChild className="mt-4">
                <Link to="/products">Browse All Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <FeaturedProductCard
                  key={product.id}
                  product={product}
                  isNew={isNewProduct(product.created_at)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sale Banner */}
      <section className="py-16 bg-gradient-to-r from-store-secondary via-store-primary to-store-secondary text-store-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-store-accent text-store-accent-foreground">Limited Time</Badge>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Up to 50% Off
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Don't miss out on our biggest sale of the season!
          </p>
          <Button 
            size="lg"
            className="bg-store-accent text-store-accent-foreground hover:bg-store-accent/90 font-semibold px-12"
            asChild
          >
            <Link to="/products?filter=sale">Shop Sale</Link>
          </Button>
        </div>
      </section>
    </StoreLayout>
  );
}
