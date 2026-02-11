import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface LiveChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: "customer" | "agent";
  sender_id: string | null;
  is_read: boolean;
  attachments: ChatAttachment[];
  created_at: string;
}

interface TypingUser {
  name: string;
  isTyping: boolean;
  sender: "customer" | "agent";
}

export interface LiveChatConversation {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_avatar: string | null;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string | null;
  assigned_to: string | null;
  unread_count: number;
  tags: string[];
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
  messages?: LiveChatMessage[];
}

export function useLiveChat() {
  const queryClient = useQueryClient();

  // Fetch all conversations
  const {
    data: conversations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["live-chat-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as LiveChatConversation[];
    },
  });

  // Subscribe to realtime changes for conversations
  useEffect(() => {
    const channel = supabase
      .channel("live-chat-conversations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_conversations",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: async (data: {
      customer_name: string;
      customer_email: string;
      customer_phone?: string;
      subject: string;
      category?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      initial_message?: string;
    }) => {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("live_chat_conversations")
        .insert({
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone || null,
          subject: data.subject,
          category: data.category || null,
          priority: data.priority || "medium",
          unread_count: 1,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add initial message if provided
      if (data.initial_message && conversation) {
        const { error: msgError } = await supabase
          .from("live_chat_messages")
          .insert({
            conversation_id: conversation.id,
            content: data.initial_message,
            sender: "customer",
            sender_type: "customer",
          });

        if (msgError) throw msgError;
      }

      return conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("নতুন কথোপকথন তৈরি হয়েছে");
    },
    onError: (error) => {
      console.error("Error creating conversation:", error);
      toast.error("কথোপকথন তৈরি করতে সমস্যা হয়েছে");
    },
  });

  // Update conversation status
  const updateConversationStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: LiveChatConversation["status"];
    }) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
    },
    onError: (error) => {
      console.error("Error updating status:", error);
      toast.error("স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে");
    },
  });

  // Delete conversation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("কথোপকথন মুছে ফেলা হয়েছে");
    },
    onError: (error) => {
      console.error("Error deleting conversation:", error);
      toast.error("কথোপকথন মুছতে সমস্যা হয়েছে");
    },
  });

  // Update conversation tags
  const updateConversationTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .update({ tags })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("ট্যাগ আপডেট হয়েছে");
    },
    onError: (error) => {
      console.error("Error updating tags:", error);
      toast.error("ট্যাগ আপডেট করতে সমস্যা হয়েছে");
    },
  });

  // Update customer notes
  const updateCustomerNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .update({ customer_notes: notes })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("নোট আপডেট হয়েছে");
    },
    onError: (error) => {
      console.error("Error updating notes:", error);
      toast.error("নোট আপডেট করতে সমস্যা হয়েছে");
    },
  });

  // Assign agent to conversation
  const assignAgent = useMutation({
    mutationFn: async ({ id, agentId }: { id: string; agentId: string | null }) => {
      const { error } = await supabase
        .from("live_chat_conversations")
        .update({ assigned_to: agentId })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
      toast.success("এজেন্ট অ্যাসাইন হয়েছে");
    },
    onError: (error) => {
      console.error("Error assigning agent:", error);
      toast.error("এজেন্ট অ্যাসাইন করতে সমস্যা হয়েছে");
    },
  });

  const stats = {
    total: conversations.length,
    open: conversations.filter((c) => c.status === "open").length,
    pending: conversations.filter((c) => c.status === "pending").length,
    resolved: conversations.filter((c) => c.status === "resolved").length,
    unreadMessages: conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0),
  };

  return {
    conversations,
    isLoading,
    error,
    stats,
    createConversation: createConversation.mutate,
    updateConversationStatus: updateConversationStatus.mutate,
    deleteConversation: deleteConversation.mutate,
    updateConversationTags: updateConversationTags.mutate,
    updateCustomerNotes: updateCustomerNotes.mutate,
    assignAgent: assignAgent.mutate,
  };
}

export function useLiveChatMessages(conversationId: string | null, customerName?: string) {
  const queryClient = useQueryClient();
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch messages for a conversation
  const {
    data: messages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["live-chat-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("live_chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []).map(msg => ({
        ...msg,
        attachments: (msg.attachments as unknown as ChatAttachment[]) || [],
        sender: msg.sender as "customer" | "agent"
      })) as LiveChatMessage[];
    },
    enabled: !!conversationId,
  });

  // Subscribe to realtime changes for messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`live-chat-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["live-chat-messages", conversationId],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Subscribe to typing presence
  useEffect(() => {
    if (!conversationId) return;

    const typingChannel = supabase.channel(`typing-${conversationId}`, {
      config: { presence: { key: `agent-${conversationId}` } }
    });

    typingChannel
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        // Check if customer is typing
        const customerTyping = Object.entries(state).find(([key, value]) => {
          const presences = value as unknown as Array<{ name: string; isTyping: boolean; sender: string }>;
          return key.startsWith("customer-") && presences.some(p => p.isTyping);
        });
        
        if (customerTyping) {
          const presences = customerTyping[1] as unknown as Array<{ name: string; isTyping: boolean; sender: string }>;
          const typing = presences.find(p => p.isTyping);
          if (typing) {
            setOtherTyping({ name: typing.name, isTyping: true, sender: "customer" });
          }
        } else {
          setOtherTyping(null);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await typingChannel.track({
            name: "এজেন্ট",
            isTyping: false,
            sender: "agent"
          });
        }
      });

    channelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(typingChannel);
      channelRef.current = null;
    };
  }, [conversationId]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!channelRef.current || isTyping) return;
    
    setIsTyping(true);
    await channelRef.current.track({
      name: "এজেন্ট",
      isTyping: true,
      sender: "agent"
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isTyping]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;
    
    setIsTyping(false);
    await channelRef.current.track({
      name: "এজেন্ট",
      isTyping: false,
      sender: "agent"
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  // Upload file
  const uploadFile = async (file: File): Promise<ChatAttachment | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${conversationId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-attachments")
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("ফাইল আপলোড করতে সমস্যা হয়েছে");
      return null;
    }
  };

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      sender = "agent",
      attachments = [],
    }: {
      content: string;
      sender?: "customer" | "agent";
      attachments?: ChatAttachment[];
    }) => {
      if (!conversationId) throw new Error("No conversation selected");

      await stopTyping();

      const { data: { user } } = await supabase.auth.getUser();

      const { error: msgError } = await supabase
        .from("live_chat_messages")
        .insert([{
          conversation_id: conversationId,
          content,
          sender,
          sender_type: sender,
          sender_id: user?.id || null,
          attachments: JSON.parse(JSON.stringify(attachments)),
        }]);

      if (msgError) throw msgError;

      // Update conversation's updated_at and reset unread count for agent messages
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (sender === "agent") {
        updateData.unread_count = 0;
      }

      const { error: convError } = await supabase
        .from("live_chat_conversations")
        .update(updateData)
        .eq("id", conversationId);

      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["live-chat-messages", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে");
    },
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;

      const { error: msgError } = await supabase
        .from("live_chat_messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false);

      if (msgError) throw msgError;

      const { error: convError } = await supabase
        .from("live_chat_conversations")
        .update({ unread_count: 0 })
        .eq("id", conversationId);

      if (convError) throw convError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-chat-conversations"] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutate,
    markAsRead: markAsRead.mutate,
    isSending: sendMessage.isPending,
    otherTyping,
    startTyping,
    stopTyping,
    uploadFile,
  };
}
