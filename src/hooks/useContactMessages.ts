import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ContactMessage {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useContactMessages() {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (error) => {
      console.error("Error marking message as read:", error);
      toast.error("Failed to mark message as read");
    },
  });

  const markAsUnread = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ is_read: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (error) => {
      console.error("Error marking message as unread:", error);
      toast.error("Failed to mark message as unread");
    },
  });

  const markAsReplied = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .update({ replied_at: new Date().toISOString(), is_read: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
    },
    onError: (error) => {
      console.error("Error marking message as replied:", error);
      toast.error("Failed to update reply status");
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] });
      toast.success("Message deleted");
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    },
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;
  const unrepliedCount = messages.filter((m) => !m.replied_at).length;

  return {
    messages,
    isLoading,
    error,
    unreadCount,
    unrepliedCount,
    markAsRead: markAsRead.mutate,
    markAsUnread: markAsUnread.mutate,
    markAsReplied: markAsReplied.mutate,
    deleteMessage: deleteMessage.mutate,
  };
}
