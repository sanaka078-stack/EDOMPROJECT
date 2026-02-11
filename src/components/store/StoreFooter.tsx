import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

export function StoreFooter() {
  const [storeName, setStoreName] = useState("Ekta Clothing");
  const [storeEmail, setStoreEmail] = useState("hello@ektaclothing.com");
  const [storePhone, setStorePhone] = useState("+880 1XXX-XXXXXX");
  const [storeAddress, setStoreAddress] = useState("123 Fashion Street, Dhanmondi, Dhaka 1205");
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  const [storeDescription, setStoreDescription] = useState("Premium fashion for the modern Bangladeshi. Quality meets style at affordable prices.");
  const [socialLinks, setSocialLinks] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
  });

  // Fetch store settings
  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings" as any)
          .select("key, setting_value")
          .in("key", [
            "STORE_NAME", "STORE_EMAIL", "STORE_PHONE", "STORE_ADDRESS", 
            "STORE_CITY", "STORE_POSTAL_CODE", "STORE_LOGO", "STORE_DESCRIPTION",
            "STORE_FACEBOOK_URL", "STORE_INSTAGRAM_URL", "STORE_TWITTER_URL", "STORE_YOUTUBE_URL"
          ]);

        if (error) throw error;

        if (data) {
          const settings = data as any[];
          const getValue = (key: string) => settings.find((s) => s.key === key)?.setting_value || "";

          if (getValue("STORE_NAME")) setStoreName(getValue("STORE_NAME"));
          if (getValue("STORE_EMAIL")) setStoreEmail(getValue("STORE_EMAIL"));
          if (getValue("STORE_PHONE")) setStorePhone(getValue("STORE_PHONE"));
          if (getValue("STORE_LOGO")) setStoreLogo(getValue("STORE_LOGO"));
          if (getValue("STORE_DESCRIPTION")) setStoreDescription(getValue("STORE_DESCRIPTION"));
          
          setSocialLinks({
            facebook: getValue("STORE_FACEBOOK_URL"),
            instagram: getValue("STORE_INSTAGRAM_URL"),
            twitter: getValue("STORE_TWITTER_URL"),
            youtube: getValue("STORE_YOUTUBE_URL"),
          });
          
          // Combine address parts
          const addressParts = [];
          if (getValue("STORE_ADDRESS")) addressParts.push(getValue("STORE_ADDRESS"));
          if (getValue("STORE_CITY")) addressParts.push(getValue("STORE_CITY"));
          if (getValue("STORE_POSTAL_CODE")) addressParts.push(getValue("STORE_POSTAL_CODE"));
          if (addressParts.length > 0) setStoreAddress(addressParts.join(", "));
        }
      } catch (error) {
        console.error("Error fetching store settings:", error);
      }
    };

    fetchStoreSettings();
  }, []);

  return (
    <footer className="bg-foreground text-background">
      {/* Newsletter */}
      <div className="bg-gradient-to-r from-store-primary via-store-secondary to-store-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-store-primary-foreground mb-2">
            Join the {storeName} Family
          </h3>
          <p className="text-store-primary-foreground/80 mb-6 max-w-md mx-auto">
            Subscribe for exclusive offers, new arrivals, and 15% off your first order!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
            <Button className="bg-store-accent text-store-accent-foreground hover:bg-store-accent/90 font-semibold px-8">
              Subscribe
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {storeLogo ? (
                <img 
                  src={storeLogo} 
                  alt={storeName} 
                  className="w-10 h-10 rounded-full object-cover border-2 border-store-primary/20"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-store-primary to-store-secondary flex items-center justify-center">
                  <span className="text-store-primary-foreground font-display font-bold text-lg">
                    {storeName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="font-display font-bold text-xl text-background">
                {storeName}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4">
              {storeDescription}
            </p>
            <div className="flex gap-3">
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-store-primary flex items-center justify-center transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-store-primary flex items-center justify-center transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {socialLinks.twitter && (
                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-store-primary flex items-center justify-center transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-background/10 hover:bg-store-primary flex items-center justify-center transition-colors">
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {/* Show default icons if no social links configured */}
              {!socialLinks.facebook && !socialLinks.instagram && !socialLinks.twitter && !socialLinks.youtube && (
                <>
                  <span className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center">
                    <Facebook className="h-4 w-4 opacity-50" />
                  </span>
                  <span className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center">
                    <Instagram className="h-4 w-4 opacity-50" />
                  </span>
                  <span className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center">
                    <Twitter className="h-4 w-4 opacity-50" />
                  </span>
                  <span className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center">
                    <Youtube className="h-4 w-4 opacity-50" />
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="text-muted-foreground hover:text-store-accent transition-colors">All Products</Link></li>
              <li><Link to="/products?filter=new" className="text-muted-foreground hover:text-store-accent transition-colors">New Arrivals</Link></li>
              <li><Link to="/products?filter=sale" className="text-muted-foreground hover:text-store-accent transition-colors">Sale</Link></li>
              <li><Link to="/products?category=men" className="text-muted-foreground hover:text-store-accent transition-colors">Men</Link></li>
              <li><Link to="/products?category=women" className="text-muted-foreground hover:text-store-accent transition-colors">Women</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-muted-foreground hover:text-store-accent transition-colors">Contact Us</Link></li>
              <li><Link to="/track-order" className="text-muted-foreground hover:text-store-accent transition-colors">Track Order</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-store-accent transition-colors">FAQs</Link></li>
              <li><Link to="/shipping-info" className="text-muted-foreground hover:text-store-accent transition-colors">Shipping Info</Link></li>
              <li><Link to="/returns" className="text-muted-foreground hover:text-store-accent transition-colors">Returns & Exchange</Link></li>
              <li><Link to="/size-guide" className="text-muted-foreground hover:text-store-accent transition-colors">Size Guide</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{storeAddress}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{storePhone}</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>{storeEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-background/10" />

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-store-accent transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-store-accent transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
