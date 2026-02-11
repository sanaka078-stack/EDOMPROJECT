import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserSession {
  id: string;
  user_id: string;
  session_token: string;
  device_info: any;
  ip_address: string | null;
  user_agent: string | null;
  is_active: boolean;
  is_current?: boolean;
  last_activity_at: string;
  last_active_at?: string;
  expires_at: string | null;
  created_at: string;
}

export function useUserSessions() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSessions([]);
        return;
      }

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      const mappedSessions: UserSession[] = (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        session_token: item.session_token,
        device_info: item.device_info,
        ip_address: item.ip_address,
        user_agent: item.user_agent,
        is_active: item.is_current ?? true,
        is_current: item.is_current,
        last_activity_at: item.last_active_at,
        last_active_at: item.last_active_at,
        expires_at: item.expires_at,
        created_at: item.created_at,
      }));
      setSessions(mappedSessions);
    } catch (error: any) {
      console.error("Error fetching user sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (deviceInfo?: any, ipAddress?: string, userAgent?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

      const { data, error } = await supabase
        .from("user_sessions")
        .insert({
          user_id: user.id,
          session_token: sessionToken,
          device_info: deviceInfo,
          ip_address: ipAddress,
          user_agent: userAgent,
          is_current: true,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      const newSession: UserSession = {
        id: data.id,
        user_id: data.user_id,
        session_token: data.session_token,
        device_info: data.device_info,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        is_active: data.is_current ?? true,
        is_current: data.is_current,
        last_activity_at: data.last_active_at,
        last_active_at: data.last_active_at,
        expires_at: data.expires_at,
        created_at: data.created_at,
      };
      setSessions((prev) => [newSession, ...prev]);
      return newSession;
    } catch (error: any) {
      console.error("Error creating session:", error);
      throw error;
    }
  };

  const revokeSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({ is_current: false })
        .eq("id", id);

      if (error) throw error;
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: false } : s)));
      toast.success("Session revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke session");
      throw error;
    }
  };

  const revokeAllSessions = async (exceptCurrent?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("user_sessions")
        .update({ is_current: false })
        .eq("user_id", user.id);

      if (exceptCurrent) {
        query = query.neq("id", exceptCurrent);
      }

      const { error } = await query;
      if (error) throw error;

      setSessions((prev) =>
        prev.map((s) =>
          s.id === exceptCurrent ? s : { ...s, is_active: false }
        )
      );
      toast.success("All sessions revoked");
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke sessions");
      throw error;
    }
  };

  const updateActivity = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_sessions")
        .update({ last_active_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      console.error("Error updating session activity:", error);
    }
  };

  const activeSessions = sessions.filter((s) => s.is_active);

  return {
    sessions,
    activeSessions,
    loading,
    refetch: fetchSessions,
    createSession,
    revokeSession,
    revokeAllSessions,
    updateActivity,
  };
}
