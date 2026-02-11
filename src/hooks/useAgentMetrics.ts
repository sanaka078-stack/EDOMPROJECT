import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAgents } from "./useAgents";

export interface AgentMetrics {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  assignedChats: number;
  assignedTickets: number;
  totalAssigned: number;
  isOnline: boolean;
  resolvedToday: number;
  avgResponseTime: string;
}

export function useAgentMetrics() {
  const { agents, isLoading: agentsLoading } = useAgents();

  // Fetch live chat conversations
  const { data: chatConversations = [] } = useQuery({
    queryKey: ["agent-metrics-chats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_chat_conversations")
        .select("assigned_to, status, created_at, updated_at")
        .not("assigned_to", "is", null);

      if (error) throw error;
      return data;
    },
  });

  // Fetch support tickets
  const { data: tickets = [] } = useQuery({
    queryKey: ["agent-metrics-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("assigned_to, status, created_at, updated_at")
        .not("assigned_to", "is", null);

      if (error) throw error;
      return data;
    },
  });

  // Fetch admin presence
  const { data: presenceData = [] } = useQuery({
    queryKey: ["agent-metrics-presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_presence")
        .select("user_id, is_online, last_seen_at");

      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics for each agent
  const agentMetrics: AgentMetrics[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return agents.map((agent) => {
      // Count assigned chats
      const agentChats = chatConversations.filter((c) => c.assigned_to === agent.user_id);
      const openChats = agentChats.filter((c) => c.status === "open" || c.status === "pending");
      
      // Count assigned tickets
      const agentTickets = tickets.filter((t) => t.assigned_to === agent.user_id);
      const openTickets = agentTickets.filter((t) => 
        t.status === "open" || t.status === "in_progress" || t.status === "waiting"
      );

      // Count resolved today
      const resolvedChatsToday = agentChats.filter((c) => {
        const updatedAt = new Date(c.updated_at);
        return c.status === "resolved" && updatedAt >= today;
      }).length;

      const resolvedTicketsToday = agentTickets.filter((t) => {
        const updatedAt = new Date(t.updated_at);
        return (t.status === "resolved" || t.status === "closed") && updatedAt >= today;
      }).length;

      // Check online status
      const presence = presenceData.find((p) => p.user_id === agent.user_id);
      const isOnline = presence?.is_online ?? false;

      return {
        ...agent,
        assignedChats: openChats.length,
        assignedTickets: openTickets.length,
        totalAssigned: openChats.length + openTickets.length,
        isOnline,
        resolvedToday: resolvedChatsToday + resolvedTicketsToday,
        avgResponseTime: "~৫ মিনিট", // Placeholder - would need first_response_at column
      };
    });
  }, [agents, chatConversations, tickets, presenceData]);

  // Summary stats
  const summary = useMemo(() => {
    const totalAssigned = agentMetrics.reduce((sum, a) => sum + a.totalAssigned, 0);
    const onlineAgents = agentMetrics.filter((a) => a.isOnline).length;
    const resolvedToday = agentMetrics.reduce((sum, a) => sum + a.resolvedToday, 0);
    
    return {
      totalAgents: agents.length,
      onlineAgents,
      offlineAgents: agents.length - onlineAgents,
      totalAssigned,
      resolvedToday,
      avgPerAgent: agents.length > 0 ? Math.round(totalAssigned / agents.length) : 0,
    };
  }, [agentMetrics, agents.length]);

  return {
    agentMetrics,
    summary,
    isLoading: agentsLoading,
  };
}
