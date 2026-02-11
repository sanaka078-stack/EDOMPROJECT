import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LoginActivity {
  id: string;
  user_id: string | null;
  email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_info: any;
  location: any;
  status: string;
  failure_reason: string | null;
  created_at: string;
}

export function useLoginActivity() {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActivities([]);
        return;
      }

      const { data, error } = await supabase
        .from("login_activity")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities((data as LoginActivity[]) || []);
    } catch (error: any) {
      console.error("Error fetching login activity:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const logActivity = async (activity: Omit<LoginActivity, "id" | "created_at">) => {
    try {
      const { error } = await supabase
        .from("login_activity")
        .insert(activity as any);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error logging activity:", error);
    }
  };

  const successfulLogins = activities.filter((a) => a.status === "success");
  const failedLogins = activities.filter((a) => a.status === "failed");

  return {
    activities,
    successfulLogins,
    failedLogins,
    loading,
    refetch: fetchActivities,
    logActivity,
  };
}
