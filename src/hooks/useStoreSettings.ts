import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StoreSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("store_settings" as any)
        .select("*")
        .order("key");

      if (error) throw error;
      // Map to expected format
      const mappedData = ((data as any[]) || []).map((item: any) => ({
        id: item.id,
        setting_key: item.key,
        setting_value: typeof item.value === 'string' ? item.value : (item.setting_value ? String(item.setting_value) : null),
        description: null,
        is_encrypted: false,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      setSettings(mappedData);
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      // Don't show error toast if user doesn't have permission
      if (!error.message?.includes("permission")) {
        toast.error("Failed to load settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("store_settings" as any)
        .update({ value: value, setting_value: value })
        .eq("key", key);

      if (error) throw error;

      setSettings((prev) =>
        prev.map((s) =>
          s.setting_key === key ? { ...s, setting_value: value } : s
        )
      );
      toast.success(`${key} updated successfully`);
      return true;
    } catch (error: any) {
      console.error("Error updating setting:", error);
      toast.error(error.message || "Failed to update setting");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updateMultipleSettings = async (
    updates: { key: string; value: string }[]
  ) => {
    try {
      setSaving(true);
      
      for (const update of updates) {
        // Use upsert to insert or update
        const { error } = await supabase
          .from("store_settings" as any)
          .upsert(
            { 
              key: update.key, 
              setting_value: update.value,
              updated_at: new Date().toISOString()
            } as any,
            { onConflict: 'key' }
          );

        if (error) throw error;
      }

      setSettings((prev) => {
        const newSettings = [...prev];
        for (const update of updates) {
          const existingIndex = newSettings.findIndex((s) => s.setting_key === update.key);
          if (existingIndex >= 0) {
            newSettings[existingIndex] = { ...newSettings[existingIndex], setting_value: update.value };
          } else {
            // Add new setting to state
            newSettings.push({
              id: crypto.randomUUID(),
              setting_key: update.key,
              setting_value: update.value,
              description: null,
              is_encrypted: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
        return newSettings;
      });
      
      toast.success("Settings updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getSettingValue = (key: string): string => {
    return settings.find((s) => s.setting_key === key)?.setting_value || "";
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    updateMultipleSettings,
    getSettingValue,
    refetch: fetchSettings,
  };
}
