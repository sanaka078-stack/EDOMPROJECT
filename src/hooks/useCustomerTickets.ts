import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface CustomerTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketReply {
  id: string;
  ticket_id: string;
  sender_type: string | null;
  sender_name: string | null;
  message: string;
  created_at: string;
  attachments?: unknown;
}

async function fetchCustomerTickets(userId: string): Promise<CustomerTicket[]> {
  // Query tickets by user_id directly since customer_id may not always be set
  const { data, error } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, description, status, priority, category, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  return ((data as any[]) || []).map((item: any): CustomerTicket => ({
    id: item.id,
    ticket_number: item.ticket_number,
    subject: item.subject,
    description: item.description,
    status: item.status,
    priority: item.priority,
    category: item.category,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));
}

export function useCustomerTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch customer's tickets
  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ["customer-tickets", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return fetchCustomerTickets(user.id);
    },
    enabled: !!user,
  });

  // Create a new ticket
  const createTicket = useMutation({
    mutationFn: async ({ subject, description, category, priority }: {
      subject: string;
      description?: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get user profile for name/email
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("user_id", user.id)
        .maybeSingle();

      // Create the ticket directly with user_id
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          customer_name: profile?.full_name || user.email?.split('@')[0] || 'Customer',
          customer_email: profile?.email || user.email || '',
          customer_phone: profile?.phone || null,
          subject,
          description: description || null,
          category: category || null,
          priority: priority || 'medium',
          ticket_number: '', // Will be auto-generated
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-tickets"] });
      toast.success("টিকেট সফলভাবে তৈরি হয়েছে");
    },
    onError: (error) => {
      console.error("Error creating ticket:", error);
      toast.error("টিকেট তৈরি করতে সমস্যা হয়েছে");
    },
  });

  return {
    tickets,
    isLoading,
    error,
    createTicket: createTicket.mutate,
    isCreating: createTicket.isPending,
  };
}

// Hook for customer ticket replies
export function useCustomerTicketReplies(ticketId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ["customer-ticket-replies", ticketId],
    queryFn: async (): Promise<TicketReply[]> => {
      if (!ticketId) return [];

      const { data, error } = await supabase
        .from("ticket_replies")
        .select("id, ticket_id, sender_type, sender_name, message, created_at, attachments")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map((item: any): TicketReply => ({
        id: item.id,
        ticket_id: item.ticket_id,
        sender_type: item.sender_type,
        sender_name: item.sender_name,
        message: item.message,
        created_at: item.created_at,
        attachments: item.attachments,
      }));
    },
    enabled: !!ticketId,
  });

  const createReply = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      if (!ticketId || !user) throw new Error("Invalid state");

      // Get customer info
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase
        .from("ticket_replies")
        .insert({
          ticket_id: ticketId,
          message: content,
          sender_type: 'customer',
          user_id: user.id,
          sender_name: profile?.full_name || 'Customer',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-ticket-replies", ticketId] });
      toast.success("রিপ্লাই পাঠানো হয়েছে");
    },
    onError: (error) => {
      console.error("Error creating reply:", error);
      toast.error("রিপ্লাই পাঠাতে সমস্যা হয়েছে");
    },
  });

  return {
    replies,
    isLoading,
    createReply: createReply.mutate,
    isCreatingReply: createReply.isPending,
  };
}
