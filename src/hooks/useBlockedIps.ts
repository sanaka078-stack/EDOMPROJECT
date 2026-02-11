import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BlockedIp {
  id: string;
  ip_address: string;
  reason: string | null;
  blocked_by: string | null;
  blocked_until: string | null;
  is_permanent: boolean;
  created_at: string;
}

export function useBlockedIps() {
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlockedIps = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blocked_ips")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlockedIps((data as BlockedIp[]) || []);
    } catch (error: any) {
      console.error("Error fetching blocked IPs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlockedIps();
  }, [fetchBlockedIps]);

  const blockIp = async (ipAddress: string, reason?: string, isPermanent: boolean = false, blockedUntil?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("blocked_ips")
        .insert({
          ip_address: ipAddress,
          reason,
          blocked_by: user?.id,
          is_permanent: isPermanent,
          blocked_until: blockedUntil,
        } as any)
        .select()
        .single();

      if (error) throw error;
      setBlockedIps((prev) => [data as BlockedIp, ...prev]);
      toast.success("IP address blocked");
      return data as BlockedIp;
    } catch (error: any) {
      toast.error(error.message || "Failed to block IP");
      throw error;
    }
  };

  const unblockIp = async (id: string) => {
    try {
      const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
      if (error) throw error;
      setBlockedIps((prev) => prev.filter((ip) => ip.id !== id));
      toast.success("IP address unblocked");
    } catch (error: any) {
      toast.error(error.message || "Failed to unblock IP");
      throw error;
    }
  };

  const isIpBlocked = (ipAddress: string) => {
    const blocked = blockedIps.find((ip) => ip.ip_address === ipAddress);
    if (!blocked) return false;
    if (blocked.is_permanent) return true;
    if (blocked.blocked_until && new Date(blocked.blocked_until) > new Date()) return true;
    return false;
  };

  return {
    blockedIps,
    loading,
    refetch: fetchBlockedIps,
    blockIp,
    unblockIp,
    isIpBlocked,
  };
}
