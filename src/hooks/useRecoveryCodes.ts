import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RecoveryCode {
  id: string;
  user_id: string;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export function useRecoveryCodes() {
  const [codes, setCodes] = useState<RecoveryCode[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCodes([]);
        return;
      }

      const { data, error } = await supabase
        .from("recovery_codes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes((data as RecoveryCode[]) || []);
    } catch (error: any) {
      console.error("Error fetching recovery codes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const generateCodes = async (count: number = 10) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate random codes
      const newCodes = Array.from({ length: count }, () => ({
        user_id: user.id,
        code: Math.random().toString(36).substring(2, 10).toUpperCase(),
        is_used: false,
      }));

      // Delete old codes first
      await supabase.from("recovery_codes").delete().eq("user_id", user.id);

      const { data, error } = await supabase
        .from("recovery_codes")
        .insert(newCodes as any)
        .select();

      if (error) throw error;
      setCodes((data as RecoveryCode[]) || []);
      toast.success(`${count} recovery codes generated`);
      return data as RecoveryCode[];
    } catch (error: any) {
      toast.error(error.message || "Failed to generate codes");
      throw error;
    }
  };

  const useCode = async (code: string) => {
    try {
      const recoveryCode = codes.find((c) => c.code === code && !c.is_used);
      if (!recoveryCode) throw new Error("Invalid or already used code");

      const { error } = await supabase
        .from("recovery_codes")
        .update({ is_used: true, used_at: new Date().toISOString() } as any)
        .eq("id", recoveryCode.id);

      if (error) throw error;
      setCodes((prev) =>
        prev.map((c) =>
          c.id === recoveryCode.id
            ? { ...c, is_used: true, used_at: new Date().toISOString() }
            : c
        )
      );
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to use recovery code");
      throw error;
    }
  };

  const unusedCodes = codes.filter((c) => !c.is_used);

  return {
    codes,
    unusedCodes,
    loading,
    refetch: fetchCodes,
    generateCodes,
    useCode,
  };
}
