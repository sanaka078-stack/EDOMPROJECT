import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeoBlockingRule {
  id: string;
  country_code: string;
  country_name: string | null;
  is_blocked: boolean;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export function useGeoBlockingRules() {
  const [rules, setRules] = useState<GeoBlockingRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("geo_blocking_rules")
        .select("*")
        .order("country_name");

      if (error) throw error;
      setRules((data as GeoBlockingRule[]) || []);
    } catch (error: any) {
      console.error("Error fetching geo blocking rules:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const addRule = async (rule: Omit<GeoBlockingRule, "id" | "created_at" | "updated_at">) => {
    try {
      const { data, error } = await supabase
        .from("geo_blocking_rules")
        .insert(rule as any)
        .select()
        .single();

      if (error) throw error;
      setRules((prev) => [...prev, data as GeoBlockingRule]);
      toast.success("Geo blocking rule added");
      return data as GeoBlockingRule;
    } catch (error: any) {
      toast.error(error.message || "Failed to add rule");
      throw error;
    }
  };

  const updateRule = async (id: string, updates: Partial<GeoBlockingRule>) => {
    try {
      const { error } = await supabase
        .from("geo_blocking_rules")
        .update(updates as any)
        .eq("id", id);

      if (error) throw error;
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      toast.success("Geo blocking rule updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update rule");
      throw error;
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase.from("geo_blocking_rules").delete().eq("id", id);
      if (error) throw error;
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success("Geo blocking rule deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete rule");
      throw error;
    }
  };

  const isCountryBlocked = (countryCode: string) => {
    const rule = rules.find((r) => r.country_code === countryCode);
    return rule?.is_blocked ?? false;
  };

  return {
    rules,
    loading,
    refetch: fetchRules,
    addRule,
    updateRule,
    deleteRule,
    isCountryBlocked,
  };
}
