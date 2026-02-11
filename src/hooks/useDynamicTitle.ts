import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useDynamicTitle() {
  const [storeName, setStoreName] = useState<string | null>(null);

  useEffect(() => {
    fetchStoreName();
  }, []);

  const fetchStoreName = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("setting_value")
        .eq("key", "STORE_NAME")
        .single();

      if (!error && data) {
        const settingValue = (data as any)?.setting_value;
        if (settingValue) {
          setStoreName(settingValue);
          document.title = settingValue;
          
          // Also update OG title meta tag
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) {
            ogTitle.setAttribute('content', settingValue);
          }
        }
      }
    } catch (error) {
      console.debug("Error fetching store name:", error);
    }
  };

  return storeName;
}

// Helper to set page-specific titles
export function setPageTitle(pageTitle?: string, storeName?: string | null) {
  const siteName = storeName || document.title.split(' | ').pop() || 'Store';
  
  if (pageTitle) {
    document.title = `${pageTitle} | ${siteName}`;
  } else {
    document.title = siteName;
  }
}
