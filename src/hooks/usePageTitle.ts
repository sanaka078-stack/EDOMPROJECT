import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useSiteTitle } from "@/components/DynamicTitleProvider";

// Page title mapping
const pageTitles: Record<string, string> = {
  // Store pages
  "/": "Home",
  "/products": "Products",
  "/cart": "Cart",
  "/checkout": "Checkout",
  "/order-confirmation": "Order Confirmed",
  "/track-order": "Track Order",
  "/account": "My Account",
  "/wishlist": "Wishlist",
  "/contact": "Contact Us",
  "/faq": "FAQ",
  "/shipping-info": "Shipping Info",
  "/returns": "Returns & Refunds",
  "/size-guide": "Size Guide",
  "/privacy": "Privacy Policy",
  "/terms": "Terms & Conditions",
  "/login": "Login",
  
  // Admin pages
  "/admin/dashboard": "Dashboard",
  "/admin/products": "Products",
  "/admin/categories": "Categories",
  "/admin/orders": "Orders",
  "/admin/analytics": "Analytics",
  "/admin/customers": "Customers",
  "/admin/settings": "Settings",
  "/admin/shipping": "Shipping",
  "/admin/messages": "Messages",
  "/admin/reports": "Reports",
  "/admin/inventory": "Inventory",
  "/admin/coupons": "Coupons",
  "/admin/profile": "Profile",
  "/admin/roles": "Role Management",
  "/admin/abandoned-carts": "Abandoned Carts",
  
  // Manager pages
  "/manager/dashboard": "Dashboard",
  "/manager/orders": "Orders",
  "/manager/products": "Products",
  "/manager/customers": "Customers",
  "/manager/messages": "Messages",
  "/manager/profile": "Profile",
  "/manager/shipping": "Shipping",
  "/manager/coupons": "Coupons",
  
  // Support pages
  "/support/dashboard": "Dashboard",
  "/support/orders": "Orders",
  "/support/customers": "Customers",
  "/support/messages": "Messages",
  "/support/profile": "Profile",
};

export function usePageTitle(customTitle?: string) {
  const location = useLocation();
  const { setPageTitle, storeName } = useSiteTitle();

  useEffect(() => {
    // Use custom title if provided
    if (customTitle) {
      setPageTitle(customTitle);
      return;
    }

    // Get title from mapping or use pathname
    const path = location.pathname;
    let title = pageTitles[path];

    // Handle dynamic routes
    if (!title) {
      if (path.startsWith("/product/")) {
        title = "Product Details";
      } else if (path.startsWith("/track/")) {
        title = "Order Tracking";
      }
    }

    if (title) {
      setPageTitle(title);
    } else {
      // Fallback: use store name only
      setPageTitle();
    }
  }, [location.pathname, customTitle, setPageTitle]);

  return { storeName, setPageTitle };
}
