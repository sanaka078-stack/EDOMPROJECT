import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft, ShoppingBag } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <StoreLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-lg mx-auto">
          {/* Animated 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-[150px] sm:text-[200px] font-display font-bold text-primary/10 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-to-br from-primary to-accent bg-clip-text text-transparent text-6xl sm:text-8xl font-display font-bold">
                404
              </div>
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl sm:text-3xl font-display font-semibold text-foreground mb-4">
            Page Not Found
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Sorry! The page you're looking for might have been removed, renamed, or is temporarily unavailable.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="gap-2 w-full sm:w-auto">
              <Link to="/">
                <Home className="h-4 w-4" />
                Go to Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
              <Link to="/products">
                <ShoppingBag className="h-4 w-4" />
                Browse Products
              </Link>
            </Button>
          </div>

          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">Or check out these links:</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
              <Link to="/faq" className="text-primary hover:underline">
                FAQ
              </Link>
              <span className="text-border">•</span>
              <Link to="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>
              <span className="text-border">•</span>
              <Link to="/track-order" className="text-primary hover:underline">
                Track Order
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
};

export default NotFound;
