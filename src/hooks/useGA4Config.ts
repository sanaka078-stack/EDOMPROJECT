import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface GA4Config {
  measurementId: string | null;
  isEnabled: boolean;
  isLoading: boolean;
}

export function useGA4Config(): GA4Config {
  const [config, setConfig] = useState<GA4Config>({
    measurementId: null,
    isEnabled: false,
    isLoading: true,
  });

  useEffect(() => {
    fetchGA4Config();
  }, []);

  const fetchGA4Config = async () => {
    try {
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("key, setting_value")
        .in("key", ["GA4_MEASUREMENT_ID", "GA4_ENABLED"]);

      if (error) throw error;

      const settings = (data as any[]) || [];
      const measurementId = settings.find(s => s.key === "GA4_MEASUREMENT_ID")?.setting_value || null;
      const isEnabled = settings.find(s => s.key === "GA4_ENABLED")?.setting_value === "true";

      setConfig({
        measurementId,
        isEnabled,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching GA4 config:", error);
      setConfig(prev => ({ ...prev, isLoading: false }));
    }
  };

  return config;
}
