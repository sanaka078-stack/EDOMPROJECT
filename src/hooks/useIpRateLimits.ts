import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface IpRateLimit {
  id: string;
  ip_address: string;
  endpoint: string | null;
  request_count: number;
  window_start: string;
  created_at: string;
}

export interface IpRateLimitSetting {
  id: string;
  endpoint: string | null;
  max_requests: number;
  window_seconds: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useIpRateLimits() {
  const [limits, setLimits] = useState<IpRateLimit[]>([]);
  const [settings, setSettings] = useState<IpRateLimitSetting[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLimits = useCallback(async () => {
    setLoading(true);
    try {
      const [limitsRes, settingsRes] = await Promise.all([
        supabase
          .from("ip_rate_limits")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("ip_rate_limit_settings")
          .select("*")
          .order("endpoint"),
      ]);

      if (limitsRes.error) throw limitsRes.error;
      if (settingsRes.error) throw settingsRes.error;

      setLimits((limitsRes.data as IpRateLimit[]) || []);
      setSettings((settingsRes.data as IpRateLimitSetting[]) || []);
    } catch (error: any) {
      console.error("Error fetching rate limits:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  const checkRateLimit = async (ipAddress: string, endpoint?: string) => {
    try {
      // Find applicable setting
      const setting = settings.find((s) => s.endpoint === endpoint) || settings.find((s) => !s.endpoint);
      if (!setting || !setting.is_enabled) return { allowed: true };

      const windowStart = new Date();
      windowStart.setSeconds(windowStart.getSeconds() - setting.window_seconds);

      // Get current count for this IP
      const { data, error } = await supabase
        .from("ip_rate_limits")
        .select("request_count")
        .eq("ip_address", ipAddress)
        .eq("endpoint", endpoint || "")
        .gte("window_start", windowStart.toISOString())
        .single();

      if (error && error.code !== "PGRST116") throw error;

      const currentCount = data?.request_count || 0;
      const allowed = currentCount < setting.max_requests;

      return {
        allowed,
        remaining: Math.max(0, setting.max_requests - currentCount - 1),
        resetAt: new Date(windowStart.getTime() + setting.window_seconds * 1000),
      };
    } catch (error: any) {
      console.error("Error checking rate limit:", error);
      return { allowed: true };
    }
  };

  const recordRequest = async (ipAddress: string, endpoint?: string) => {
    try {
      const { error } = await supabase
        .from("ip_rate_limits")
        .insert({
          ip_address: ipAddress,
          endpoint: endpoint || null,
          request_count: 1,
        } as any);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error recording request:", error);
    }
  };

  const updateSetting = async (id: string, updates: Partial<IpRateLimitSetting>) => {
    try {
      const { error } = await supabase
        .from("ip_rate_limit_settings")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setSettings((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    } catch (error: any) {
      console.error("Error updating rate limit setting:", error);
      throw error;
    }
  };

  return {
    limits,
    settings,
    loading,
    refetch: fetchLimits,
    checkRateLimit,
    recordRequest,
    updateSetting,
  };
}
