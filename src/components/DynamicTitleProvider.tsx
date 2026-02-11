import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TitleContextType {
  storeName: string;
  setPageTitle: (title?: string) => void;
}

const TitleContext = createContext<TitleContextType>({
  storeName: "Store",
  setPageTitle: () => {},
});

export function useSiteTitle() {
  return useContext(TitleContext);
}

export function DynamicTitleProvider({ children }: { children: ReactNode }) {
  const [storeName, setStoreName] = useState("Store");

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
          updateMetaTags(settingValue);
        }
      }
    } catch (error) {
      console.debug("Error fetching store name:", error);
    }
  };

  const updateMetaTags = (name: string) => {
    // OG Title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', name);
    
    // Twitter Title
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', name);
  };

  const setPageTitle = (title?: string) => {
    if (title) {
      document.title = `${title} | ${storeName}`;
    } else {
      document.title = storeName;
    }
  };

  return (
    <TitleContext.Provider value={{ storeName, setPageTitle }}>
      {children}
    </TitleContext.Provider>
  );
}
