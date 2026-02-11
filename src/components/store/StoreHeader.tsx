import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Search, Menu, X, User, Heart, LogOut, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { CartDrawer } from "./CartDrawer";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/products" },
  { label: "New Arrivals", href: "/products?filter=new" },
  { label: "Sale", href: "/products?filter=sale" },
];

export function StoreHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("Ekta Clothing");
  const { itemCount, setIsOpen: setCartOpen } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Fetch store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings" as any)
          .select("key, setting_value")
          .in("key", ["STORE_LOGO", "STORE_NAME"]);

        if (error) throw error;

        if (data) {
          const logoSetting = (data as any[]).find((s) => s.key === "STORE_LOGO");
          const nameSetting = (data as any[]).find((s) => s.key === "STORE_NAME");
          
          if (logoSetting?.setting_value) {
            setStoreLogo(logoSetting.setting_value);
          }
          if (nameSetting?.setting_value) {
            setStoreName(nameSetting.setting_value);
          }
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    };

    fetchStoreSettings();
  }, []);

  // Determine where to redirect the user icon
  const getAccountPath = () => {
    if (!user) return "/login";
    
    // Staff members go to their respective dashboards
    if (role === 'admin') return "/admin/dashboard";
    if (role === 'manager') return "/manager/dashboard";
    if (role === 'support') return "/support/dashboard";
    
    // Regular customers go to account page
    return "/account";
  };

  return (
    <header className="sticky top-0 z-50 bg-store-card/95 backdrop-blur-md border-b border-store-muted">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-store-primary via-store-secondary to-store-accent text-store-primary-foreground py-2 text-center text-sm font-medium">
        🔥 Free Shipping on Orders Over ৳2,000 | Use Code: EKTA20 for 20% Off
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-lg font-medium text-foreground hover:text-store-primary transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            {storeLogo ? (
              <img 
                src={storeLogo} 
                alt={storeName} 
                className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border-2 border-store-primary/20"
              />
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-store-primary to-store-secondary flex items-center justify-center">
                <span className="text-store-primary-foreground font-display font-bold text-lg md:text-xl">
                  {storeName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-display font-bold text-xl md:text-2xl bg-gradient-to-r from-store-primary to-store-secondary bg-clip-text text-transparent">
              {storeName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-foreground hover:text-store-primary transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-store-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {searchOpen ? (
              <div className="absolute left-0 right-0 top-full bg-store-card p-4 border-b border-store-muted shadow-lg md:relative md:top-0 md:shadow-none md:border-none md:p-0">
                <div className="flex items-center gap-2 max-w-md mx-auto md:mx-0">
                  <Input 
                    placeholder="Search products..." 
                    className="flex-1"
                    autoFocus
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setSearchOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Wishlist */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex relative"
              onClick={() => navigate('/wishlist')}
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-store-primary text-store-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </Button>

            {/* Account */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {(role === 'admin' || role === 'manager' || role === 'support') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate(
                        role === 'admin' ? '/admin/dashboard' : 
                        role === 'manager' ? '/manager/dashboard' : '/support/dashboard'
                      )}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <User className="mr-2 h-4 w-4" />
                    My Account
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/account')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    My Orders
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/login')}
              >
                <User className="h-5 w-5" />
              </Button>
            )}

            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-store-secondary text-store-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Cart Drawer */}
      <CartDrawer />
    </header>
  );
}
