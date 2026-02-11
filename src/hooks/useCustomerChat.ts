import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsAdminOnline } from "./useAdminPresence";
import { useAutoReplySettings } from "./useAutoReplySettings";

export interface ChatAttachment {
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  sender: "customer" | "agent";
  sender_id: string | null;
  is_read: boolean;
  attachments: ChatAttachment[];
  created_at: string;
}

export interface ChatConversation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subject: string;
  status: "open" | "pending" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

interface TypingUser {
  name: string;
  isTyping: boolean;
  sender: "customer" | "agent";
}

const SESSION_KEY = "customer_chat_session";
const CUSTOMER_INFO_KEY = "customer_chat_info";

export function useCustomerChat() {
  const queryClient = useQueryClient();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState<TypingUser | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const autoReplySentRef = useRef<Set<string>>(new Set());

  // Admin presence and auto-reply settings
  const { hasOnlineAdmin, isChecking: isCheckingAdmin } = useIsAdminOnline();
  const { settings: autoReplySettings } = useAutoReplySettings();

  // Load existing session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      setConversationId(savedSession);
    }
  }, []);

  // Get customer info from localStorage
  const getCustomerInfo = useCallback(() => {
    const saved = localStorage.getItem(CUSTOMER_INFO_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  }, []);

  // Save customer info to localStorage
  const saveCustomerInfo = useCallback((info: { name: string; email: string; phone?: string }) => {
    localStorage.setItem(CUSTOMER_INFO_KEY, JSON.stringify(info));
  }, []);

  // Fetch current conversation
  const { data: conversation, isLoading: isConversationLoading } = useQuery({
    queryKey: ["customer-chat-conversation", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;
      
      const { data, error } = await supabase
        .from("live_chat_conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (error) {
        // Conversation doesn't exist, clear session
        localStorage.removeItem(SESSION_KEY);
        setConversationId(null);
        return null;
      }
      return data as ChatConversation;
    },
    enabled: !!conversationId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["customer-chat-messages", conversationId],
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
        attachments: (msg.attachments as unknown as ChatAttachment[]) || []
      })) as ChatMessage[];
    },
    enabled: !!conversationId,
  });

  // Subscribe to realtime messages and typing
  useEffect(() => {
    if (!conversationId) return;

    // Messages subscription
    const messagesChannel = supabase
      .channel(`customer-chat-messages-${conversationId}`)
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
            queryKey: ["customer-chat-messages", conversationId],
          });
        }
      )
      .subscribe();

    // Typing presence subscription
    const customerInfo = getCustomerInfo();
    const typingChannel = supabase.channel(`typing-${conversationId}`, {
      config: { presence: { key: `customer-${conversationId}` } }
    });

    typingChannel
      .on("presence", { event: "sync" }, () => {
        const state = typingChannel.presenceState();
        // Check if agent is typing
        const agentTyping = Object.entries(state).find(([key, value]) => {
          const presences = value as unknown as Array<{ name: string; isTyping: boolean; sender: string }>;
          return key.startsWith("agent-") && presences.some(p => p.isTyping);
        });
        
        if (agentTyping) {
          const presences = agentTyping[1] as unknown as Array<{ name: string; isTyping: boolean; sender: string }>;
          const typing = presences.find(p => p.isTyping);
          if (typing) {
            setOtherTyping({ name: typing.name, isTyping: true, sender: "agent" });
          }
        } else {
          setOtherTyping(null);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && customerInfo) {
          await typingChannel.track({
            name: customerInfo.name,
            isTyping: false,
            sender: "customer"
          });
        }
      });

    channelRef.current = typingChannel;

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
      channelRef.current = null;
    };
  }, [conversationId, queryClient, getCustomerInfo]);

  // Start typing
  const startTyping = useCallback(async () => {
    if (!channelRef.current || isTyping) return;
    
    const customerInfo = getCustomerInfo();
    if (!customerInfo) return;

    setIsTyping(true);
    await channelRef.current.track({
      name: customerInfo.name,
      isTyping: true,
      sender: "customer"
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [isTyping, getCustomerInfo]);

  // Stop typing
  const stopTyping = useCallback(async () => {
    if (!channelRef.current) return;
    
    const customerInfo = getCustomerInfo();
    if (!customerInfo) return;

    setIsTyping(false);
    await channelRef.current.track({
      name: customerInfo.name,
      isTyping: false,
      sender: "customer"
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [getCustomerInfo]);

  // Start new conversation
  const startConversation = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      phone?: string;
      subject: string;
      initialMessage: string;
    }) => {
      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from("live_chat_conversations")
        .insert({
          customer_name: data.name,
          customer_email: data.email,
          customer_phone: data.phone || null,
          subject: data.subject,
          status: "open",
          unread_count: 1,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add initial message
      const { error: msgError } = await supabase
        .from("live_chat_messages")
        .insert({
          conversation_id: conv.id,
          content: data.initialMessage,
          sender: "customer",
          sender_type: "customer",
          attachments: [],
        });

      if (msgError) throw msgError;

      // Save session
      localStorage.setItem(SESSION_KEY, conv.id);
      saveCustomerInfo({ name: data.name, email: data.email, phone: data.phone });
      
      return { conv, shouldAutoReply: !hasOnlineAdmin && autoReplySettings.enabled };
    },
    onSuccess: async ({ conv, shouldAutoReply }) => {
      setConversationId(conv.id);
      toast.success("চ্যাট শুরু হয়েছে!");

      // Send auto-reply if admin is offline
      if (shouldAutoReply && autoReplySettings.message) {
        // Mark that we're sending auto-reply for this conversation
        autoReplySentRef.current.add(conv.id);
        
        // Delay before sending auto-reply
        setTimeout(async () => {
          try {
            await supabase
              .from("live_chat_messages")
              .insert({
                conversation_id: conv.id,
                content: autoReplySettings.message,
                sender: "agent",
                sender_type: "agent",
                attachments: [],
              });
            
            queryClient.invalidateQueries({
              queryKey: ["customer-chat-messages", conv.id],
            });
          } catch (error) {
            console.error("Error sending auto-reply:", error);
          }
        }, (autoReplySettings.delaySeconds || 3) * 1000);
      }
    },
    onError: (error) => {
      console.error("Error starting conversation:", error);
      toast.error("চ্যাট শুরু করতে সমস্যা হয়েছে");
    },
  });

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
    mutationFn: async ({ content, attachments = [] }: { content: string; attachments?: ChatAttachment[] }) => {
      if (!conversationId) throw new Error("No conversation");

      await stopTyping();

      const { error } = await supabase
        .from("live_chat_messages")
        .insert([{
          conversation_id: conversationId,
          content,
          sender: "customer",
          sender_type: "customer",
          attachments: JSON.parse(JSON.stringify(attachments)),
        }]);

      if (error) throw error;

      // Update conversation
      await supabase
        .from("live_chat_conversations")
        .update({ 
          updated_at: new Date().toISOString(),
          unread_count: 1 // Increment for admin
        })
        .eq("id", conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["customer-chat-messages", conversationId],
      });
    },
    onError: (error) => {
      console.error("Error sending message:", error);
      toast.error("মেসেজ পাঠাতে সমস্যা হয়েছে");
    },
  });

  // End conversation
  const endConversation = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setConversationId(null);
  }, []);

  return {
    conversationId,
    conversation,
    isConversationLoading,
    messages,
    messagesLoading,
    otherTyping,
    hasOnlineAdmin,
    isCheckingAdmin,
    startConversation: startConversation.mutate,
    isStarting: startConversation.isPending,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
    uploadFile,
    startTyping,
    stopTyping,
    endConversation,
    getCustomerInfo,
  };
}
