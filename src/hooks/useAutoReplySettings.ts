import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutoReplySettings {
  enabled: boolean;
  message: string;
  delaySeconds: number;
}

const DEFAULT_SETTINGS: AutoReplySettings = {
  enabled: true,
  message: "ধন্যবাদ আমাদের সাথে যোগাযোগ করার জন্য! আমাদের টিম এই মুহূর্তে অফলাইনে আছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
  delaySeconds: 5,
};

const SETTINGS_KEY = "live_chat_auto_reply";

export function useAutoReplySettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["auto-reply-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_settings")
        .select("setting_value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        try {
          return JSON.parse(data.setting_value) as AutoReplySettings;
        } catch {
          return DEFAULT_SETTINGS;
        }
      }

      return DEFAULT_SETTINGS;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<AutoReplySettings>) => {
      const currentSettings = settings || DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...newSettings };

      const { error } = await supabase
        .from("store_settings")
        .upsert(
          {
            key: SETTINGS_KEY,
            setting_value: JSON.stringify(updatedSettings),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;
      return updatedSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-reply-settings"] });
      toast.success("অটো-রিপ্লাই সেটিংস সেভ হয়েছে");
    },
    onError: (error) => {
      console.error("Error updating auto-reply settings:", error);
      toast.error("সেটিংস সেভ করতে সমস্যা হয়েছে");
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}
