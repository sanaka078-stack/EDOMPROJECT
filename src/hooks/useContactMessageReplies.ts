import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ContactMessageReply {
  id: string;
  message_id: string;
  replied_by: string;
  reply_subject: string;
  reply_content: string;
  recipient_email: string;
  created_at: string;
}

export function useContactMessageReplies(messageId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ["contact-message-replies", messageId],
    queryFn: async () => {
      if (!messageId) return [];
      
      const { data, error } = await supabase
        .from("contact_message_replies")
        .select("*")
        .eq("message_id", messageId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ContactMessageReply[];
    },
    enabled: !!messageId,
  });

  const addReply = useMutation({
    mutationFn: async ({
      messageId,
      subject,
      content,
      recipientEmail,
    }: {
      messageId: string;
      subject: string;
      content: string;
      recipientEmail: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("contact_message_replies")
        .insert({
          message_id: messageId,
          replied_by: user.id,
          reply_subject: subject,
          reply_content: content,
          recipient_email: recipientEmail,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contact-message-replies", variables.messageId] });
    },
    onError: (error) => {
      console.error("Error saving reply:", error);
      toast.error("Failed to save reply history");
    },
  });

  return {
    replies,
    isLoading,
    addReply: addReply.mutateAsync,
  };
}
