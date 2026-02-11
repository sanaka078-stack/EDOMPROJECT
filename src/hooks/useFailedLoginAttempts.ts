import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FailedLoginAttempt {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  attempt_count: number;
  last_attempt_at: string;
  created_at: string;
}

export interface BlockedLoginAttempt {
  id: string;
  email: string | null;
  ip_address: string | null;
  reason: string | null;
  blocked_until: string | null;
  is_permanent: boolean;
  created_at: string;
}

export function useFailedLoginAttempts() {
  const [failedAttempts, setFailedAttempts] = useState<FailedLoginAttempt[]>([]);
  const [blockedAttempts, setBlockedAttempts] = useState<BlockedLoginAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const [failedRes, blockedRes] = await Promise.all([
        supabase
          .from("failed_login_attempts")
          .select("*")
          .order("last_attempt_at", { ascending: false })
          .limit(100),
        supabase
          .from("blocked_login_attempts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (failedRes.error) throw failedRes.error;
      if (blockedRes.error) throw blockedRes.error;

      setFailedAttempts((failedRes.data as FailedLoginAttempt[]) || []);
      setBlockedAttempts((blockedRes.data as BlockedLoginAttempt[]) || []);
    } catch (error: any) {
      console.error("Error fetching login attempts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const recordFailedAttempt = async (email: string, ipAddress?: string, userAgent?: string) => {
    try {
      // Check if there's an existing record
      const { data: existing } = await supabase
        .from("failed_login_attempts")
        .select("id, attempt_count")
        .eq("email", email)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("failed_login_attempts")
          .update({
            attempt_count: existing.attempt_count + 1,
            last_attempt_at: new Date().toISOString(),
            ip_address: ipAddress,
            user_agent: userAgent,
          } as any)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("failed_login_attempts")
          .insert({
            email,
            ip_address: ipAddress,
            user_agent: userAgent,
            attempt_count: 1,
          } as any);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error recording failed attempt:", error);
    }
  };

  const clearFailedAttempts = async (email: string) => {
    try {
      const { error } = await supabase
        .from("failed_login_attempts")
        .delete()
        .eq("email", email);

      if (error) throw error;
      setFailedAttempts((prev) => prev.filter((a) => a.email !== email));
    } catch (error: any) {
      console.error("Error clearing failed attempts:", error);
    }
  };

  const isBlocked = (email: string, ipAddress?: string) => {
    const now = new Date();
    return blockedAttempts.some((b) => {
      if (b.email === email || b.ip_address === ipAddress) {
        if (b.is_permanent) return true;
        if (b.blocked_until && new Date(b.blocked_until) > now) return true;
      }
      return false;
    });
  };

  const getFailedCount = (email: string) => {
    const attempt = failedAttempts.find((a) => a.email === email);
    return attempt?.attempt_count || 0;
  };

  return {
    failedAttempts,
    blockedAttempts,
    loading,
    refetch: fetchAttempts,
    recordFailedAttempt,
    clearFailedAttempts,
    isBlocked,
    getFailedCount,
  };
}
