import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { ProtectedRoute, AdminRoute, ManagerRoute, SupportRoute } from "@/components/ProtectedRoute";
import { GA4Provider } from "@/components/GA4Provider";
import { DynamicTitleProvider } from "@/components/DynamicTitleProvider";
import { AutoPageTitle } from "@/components/AutoPageTitle";

// Store Pages (Main routes - public)
import StoreHome from "./pages/store/StoreHome";
import StoreProducts from "./pages/store/StoreProducts";
import ProductDetail from "./pages/store/ProductDetail";
import Cart from "./pages/store/Cart";
import TrackOrder from "./pages/store/TrackOrder";
import Checkout from "./pages/store/Checkout";
import OrderConfirmation from "./pages/store/OrderConfirmation";
// StoreLogin removed - using Auth page instead
import Account from "./pages/store/Account";
import OrderTracking from "./pages/store/OrderTracking";
import Wishlist from "./pages/store/Wishlist";
import Contact from "./pages/store/Contact";
import FAQ from "./pages/store/FAQ";
import ShippingInfo from "./pages/store/ShippingInfo";
import Returns from "./pages/store/Returns";
import SizeGuide from "./pages/store/SizeGuide";
import Privacy from "./pages/store/Privacy";
import Terms from "./pages/store/Terms";

// Admin Pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import Categories from "./pages/Categories";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Shipping from "./pages/Shipping";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Inventory from "./pages/Inventory";
import Coupons from "./pages/Coupons";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import RoleManagement from "./pages/RoleManagement";
import AbandonedCarts from "./pages/AbandonedCarts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <GA4Provider>
                <DynamicTitleProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <AutoPageTitle />
                      <Routes>
                    {/* ====================== */}
                    {/* Store Frontend Routes (Main) - Public */}
                    {/* ====================== */}
                    <Route path="/" element={<StoreHome />} />
                    <Route path="/products" element={<StoreProducts />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-confirmation" element={<OrderConfirmation />} />
                    
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/track/:orderNumber" element={<OrderTracking />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/shipping-info" element={<ShippingInfo />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="/size-guide" element={<SizeGuide />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    {/* Customer Account Routes (User role) */}
                    <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
                    <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
                    
                    {/* ====================== */}
                    {/* Admin Routes - Only admin role */}
                    {/* ====================== */}
                    <Route path="/admin/dashboard" element={<AdminRoute><Index /></AdminRoute>} />
                    <Route path="/admin/products" element={<AdminRoute><Products /></AdminRoute>} />
                    <Route path="/admin/categories" element={<AdminRoute><Categories /></AdminRoute>} />
                    <Route path="/admin/orders" element={<AdminRoute><Orders /></AdminRoute>} />
                    <Route path="/admin/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
                    <Route path="/admin/customers" element={<AdminRoute><Customers /></AdminRoute>} />
                    <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                    <Route path="/admin/shipping" element={<AdminRoute><Shipping /></AdminRoute>} />
                    <Route path="/admin/messages" element={<AdminRoute><Messages /></AdminRoute>} />
                    <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                    <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
                    <Route path="/admin/coupons" element={<AdminRoute><Coupons /></AdminRoute>} />
                    <Route path="/admin/profile" element={<AdminRoute><Profile /></AdminRoute>} />
                    <Route path="/admin/roles" element={<AdminRoute><RoleManagement /></AdminRoute>} />
                    <Route path="/admin/abandoned-carts" element={<AdminRoute><AbandonedCarts /></AdminRoute>} />
                    
                    {/* ====================== */}
                    {/* Manager Routes - Manager & Admin access */}
                    {/* ====================== */}
                    <Route path="/manager/dashboard" element={<ManagerRoute><Index /></ManagerRoute>} />
                    <Route path="/manager/orders" element={<ManagerRoute><Orders /></ManagerRoute>} />
                    <Route path="/manager/products" element={<ManagerRoute><Products /></ManagerRoute>} />
                    <Route path="/manager/customers" element={<ManagerRoute><Customers /></ManagerRoute>} />
                    <Route path="/manager/messages" element={<ManagerRoute><Messages /></ManagerRoute>} />
                    <Route path="/manager/profile" element={<ManagerRoute><Profile /></ManagerRoute>} />
                    <Route path="/manager/shipping" element={<ManagerRoute><Shipping /></ManagerRoute>} />
                    <Route path="/manager/coupons" element={<ManagerRoute><Coupons /></ManagerRoute>} />

                    {/* ====================== */}
                    {/* Support Routes - Support, Manager & Admin access */}
                    {/* ====================== */}
                    <Route path="/support/dashboard" element={<SupportRoute><Index /></SupportRoute>} />
                    <Route path="/support/orders" element={<SupportRoute><Orders /></SupportRoute>} />
                    <Route path="/support/customers" element={<SupportRoute><Customers /></SupportRoute>} />
                    <Route path="/support/messages" element={<SupportRoute><Messages /></SupportRoute>} />
                    <Route path="/support/profile" element={<SupportRoute><Profile /></SupportRoute>} />

                    {/* Legacy redirect routes - redirect old paths to new structure */}
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </TooltipProvider>
              </DynamicTitleProvider>
            </GA4Provider>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
