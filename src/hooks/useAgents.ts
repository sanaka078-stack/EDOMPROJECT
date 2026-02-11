import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Agent {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
}

export function useAgents() {
  const { data: agents = [], isLoading, error } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      // First get all admin/moderator user_ids
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["admin", "manager", "support"]);

      if (rolesError) throw rolesError;
      if (!rolesData || rolesData.length === 0) return [];

      const userIds = rolesData.map(r => r.user_id);

      // Then get profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Merge the data
      return rolesData.map((roleItem) => {
        const profile = profilesData?.find(p => p.user_id === roleItem.user_id);
        return {
          user_id: roleItem.user_id,
          role: roleItem.role,
          full_name: profile?.full_name || null,
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
        };
      }) as Agent[];
    },
  });

  return { agents, isLoading, error };
}
