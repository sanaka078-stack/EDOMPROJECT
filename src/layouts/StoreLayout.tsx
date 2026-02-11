import { ReactNode, useEffect } from "react";
import { StoreHeader } from "@/components/store/StoreHeader";
import { StoreFooter } from "@/components/store/StoreFooter";
import { LiveChatWidget } from "@/components/store/LiveChatWidget";
import { supabase } from "@/integrations/supabase/client";
import { usePageViewTracking } from "@/hooks/usePageViewTracking";

interface StoreLayoutProps {
  children: ReactNode;
}

export function StoreLayout({ children }: StoreLayoutProps) {
  // Track page views for internal analytics
  usePageViewTracking();
  // Fetch and apply favicon from store settings
  useEffect(() => {
    const fetchAndApplyFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from("store_settings" as any)
          .select("key, setting_value")
          .eq("key", "STORE_FAVICON")
          .single();

        if (error) throw error;

        if (data && (data as any).setting_value) {
          let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = (data as any).setting_value;
        }
      } catch (error) {
        console.error("Error fetching favicon:", error);
      }
    };

    fetchAndApplyFavicon();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-store-background">
      <StoreHeader />
      <main className="flex-1">
        {children}
      </main>
      <StoreFooter />
      <LiveChatWidget />
    </div>
  );
}
