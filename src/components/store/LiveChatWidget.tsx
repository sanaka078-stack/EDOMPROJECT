import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Loader2,
  File,
  Minimize2,
  Smile,
  Check,
  CheckCheck,
} from "lucide-react";
import { useCustomerChat, ChatAttachment } from "@/hooks/useCustomerChat";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { cn } from "@/lib/utils";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const {
    conversationId,
    conversation,
    isConversationLoading,
    messages,
    messagesLoading,
    otherTyping,
    hasOnlineAdmin,
    startConversation,
    isStarting,
    sendMessage,
    isSending,
    uploadFile,
    startTyping,
    stopTyping,
    getCustomerInfo,
  } = useCustomerChat();

  const { requestPermission, showNotification, playNotificationSound } = useChatNotifications();

  // Request notification permission when chat opens
  useEffect(() => {
    if (isOpen && conversationId) {
      requestPermission();
    }
  }, [isOpen, conversationId, requestPermission]);

  // Show notification on new agent messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === "agent") {
        playNotificationSound();
        showNotification("নতুন মেসেজ এসেছে", {
          body: latestMessage.content.substring(0, 100),
          tag: "chat-message",
        });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, showNotification, playNotificationSound]);

  // Check if there's an existing conversation
  useEffect(() => {
    // Only hide start form if conversation exists AND is loaded
    if (conversationId && conversation) {
      setShowStartForm(false);
    } else if (!conversationId) {
      setShowStartForm(true);
    }
  }, [conversationId, conversation]);

  // Pre-fill form with saved info
  useEffect(() => {
    const savedInfo = getCustomerInfo();
    if (savedInfo) {
      setFormData(prev => ({
        ...prev,
        name: savedInfo.name || "",
        email: savedInfo.email || "",
        phone: savedInfo.phone || "",
      }));
    }
  }, [getCustomerInfo]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  const handleStartConversation = () => {
    if (!formData.name || !formData.email || !formData.subject || !formData.message) return;

    startConversation({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      subject: formData.subject,
      initialMessage: formData.message,
    });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && pendingAttachments.length === 0) || isSending) return;

    await stopTyping();
    sendMessage({ content: newMessage.trim(), attachments: pendingAttachments });
    setNewMessage("");
    setPendingAttachments([]);
    setShowEmojiPicker(false);
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: ChatAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        continue; // Skip files larger than 5MB
      }
      const attachment = await uploadFile(file);
      if (attachment) {
        newAttachments.push(attachment);
      }
    }

    setPendingAttachments(prev => [...prev, ...newAttachments]);
    setIsUploading(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    startTyping();
  };

  const renderAttachment = (attachment: ChatAttachment) => {
    const isImage = attachment.type.startsWith("image/");
    
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 bg-background/50 rounded border hover:bg-background transition-colors"
      >
        {isImage ? (
          <img src={attachment.url} alt={attachment.name} className="w-16 h-16 object-cover rounded" />
        ) : (
          <>
            <File className="h-4 w-4" />
            <span className="text-xs truncate max-w-[100px]">{attachment.name}</span>
          </>
        )}
      </a>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-store-primary hover:bg-store-primary/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[360px] bg-background border rounded-lg shadow-2xl flex flex-col transition-all duration-300",
        isMinimized ? "h-14" : "h-[500px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-store-primary text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <span className="font-medium">লাইভ চ্যাট</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  hasOnlineAdmin ? "bg-green-400" : "bg-yellow-400"
                )}
              />
              <span className="opacity-80">
                {hasOnlineAdmin ? "অনলাইন" : "অফলাইন"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Loading state while checking conversation */}
          {conversationId && isConversationLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-store-primary" />
            </div>
          ) : showStartForm && !conversationId ? (
            /* Start Conversation Form */
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="font-semibold text-lg">আমাদের সাথে চ্যাট করুন!</h3>
                  <p className="text-sm text-muted-foreground">আপনার তথ্য দিয়ে চ্যাট শুরু করুন</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="chat-name" className="text-sm">আপনার নাম *</Label>
                    <Input
                      id="chat-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="নাম লিখুন"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat-email" className="text-sm">ইমেইল *</Label>
                    <Input
                      id="chat-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat-phone" className="text-sm">ফোন (ঐচ্ছিক)</Label>
                    <Input
                      id="chat-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat-subject" className="text-sm">বিষয় *</Label>
                    <Input
                      id="chat-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="কি বিষয়ে জানতে চান?"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chat-message" className="text-sm">মেসেজ *</Label>
                    <Textarea
                      id="chat-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="আপনার প্রশ্ন বা মেসেজ লিখুন..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStartConversation}
                  className="w-full bg-store-primary hover:bg-store-primary/90"
                  disabled={isStarting || !formData.name || !formData.email || !formData.subject || !formData.message}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      শুরু হচ্ছে...
                    </>
                  ) : (
                    "চ্যাট শুরু করুন"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <>
              <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                <div className="space-y-3">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      কোনো মেসেজ নেই
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.sender === "customer" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-2.5",
                            message.sender === "customer"
                              ? "bg-store-primary text-white"
                              : "bg-muted"
                          )}
                        >
                          {message.sender === "agent" && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[10px]">A</AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">এজেন্ট</span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {/* Attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((att, i) => (
                                <div key={i}>{renderAttachment(att)}</div>
                              ))}
                            </div>
                          )}
                          
                          <div
                            className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              message.sender === "customer" ? "text-white/70" : "text-muted-foreground"
                            )}
                          >
                            <span className="text-[10px]">
                              {format(new Date(message.created_at), "hh:mm a", { locale: bn })}
                            </span>
                            {message.sender === "customer" && (
                              message.is_read ? (
                                <CheckCheck className="h-3 w-3 text-blue-400" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Typing indicator */}
                  {otherTyping?.isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">এজেন্ট টাইপ করছে</span>
                          <div className="flex gap-0.5">
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Pending attachments preview */}
              {pendingAttachments.length > 0 && (
                <div className="px-3 py-2 border-t">
                  <div className="flex gap-2 flex-wrap">
                    {pendingAttachments.map((att, i) => (
                      <div key={i} className="relative group">
                        {att.type.startsWith("image/") ? (
                          <img src={att.url} alt={att.name} className="w-12 h-12 object-cover rounded border" />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border">
                            <File className="h-5 w-5" />
                          </div>
                        )}
                        <button
                          onClick={() => removeAttachment(i)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message input */}
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 border-0" side="top" align="start">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={Theme.AUTO}
                        width={320}
                        height={350}
                        searchPlaceholder="ইমোজি খুঁজুন..."
                        previewConfig={{ showPreview: false }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    placeholder="মেসেজ লিখুন..."
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-9 w-9 shrink-0 bg-store-primary hover:bg-store-primary/90"
                    disabled={isSending || (!newMessage.trim() && pendingAttachments.length === 0)}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
