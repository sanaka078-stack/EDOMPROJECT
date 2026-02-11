import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Send,
  Search,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Filter,
  MoreVertical,
  Paperclip,
  Smile,
  Archive,
  User,
  Trash2,
  Loader2,
  Inbox,
  X,
  FileText,
  Check,
  CheckCheck,
  Tag,
  UserPlus,
  Users,
} from "lucide-react";
import { useLiveChat, useLiveChatMessages, LiveChatConversation, ChatAttachment } from "@/hooks/useLiveChat";
import { useAgents, Agent } from "@/hooks/useAgents";
import { QuickReplyPicker } from "./QuickReplyPicker";
import { ConversationTagsEditor } from "./ConversationTagsEditor";
import { CustomerNotesEditor } from "./CustomerNotesEditor";
import { useCannedResponses } from "@/hooks/useCannedResponses";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useAdminPresence } from "@/hooks/useAdminPresence";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Inbox },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function LiveChatTab() {
  const { user } = useAuth();
  const { conversations, isLoading, updateConversationStatus, deleteConversation, createConversation, updateConversationTags, updateCustomerNotes, assignAgent } = useLiveChat();
  const { agents } = useAgents();
  const { trackPresence, untrackPresence } = useAdminPresence();
  const [selectedConversation, setSelectedConversation] = useState<LiveChatConversation | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false);
  const [newConversation, setNewConversation] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    subject: "",
    category: "",
    priority: "medium" as LiveChatConversation["priority"],
    initial_message: "",
  });

  // Track admin presence when component mounts
  useEffect(() => {
    if (user?.id && user?.email) {
      trackPresence(user.id, user.email);
    }

    return () => {
      untrackPresence();
    };
  }, [user?.id, user?.email, trackPresence, untrackPresence]);

  // Update selected conversation when conversations change
  useEffect(() => {
    if (selectedConversation) {
      const updated = conversations.find((c) => c.id === selectedConversation.id);
      if (updated) {
        setSelectedConversation(updated);
      }
    }
  }, [conversations, selectedConversation?.id]);

  // Get all unique tags from conversations
  const allTags = Array.from(
    new Set(conversations.flatMap((c) => c.tags || []))
  ).sort();

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || conv.status === statusFilter;
    const matchesTag = tagFilter === "all" || (conv.tags && conv.tags.includes(tagFilter));
    const matchesAgent = agentFilter === "all" || 
      (agentFilter === "unassigned" ? !conv.assigned_to : conv.assigned_to === agentFilter);
    return matchesSearch && matchesStatus && matchesTag && matchesAgent;
  });

  const handleAgentAssign = (convId: string, agentId: string | null) => {
    assignAgent({ id: convId, agentId });
    if (selectedConversation?.id === convId) {
      setSelectedConversation({ ...selectedConversation, assigned_to: agentId });
    }
  };

  const handleCreateConversation = () => {
    if (!newConversation.customer_name || !newConversation.customer_email || !newConversation.subject) {
      return;
    }

    createConversation({
      customer_name: newConversation.customer_name,
      customer_email: newConversation.customer_email,
      customer_phone: newConversation.customer_phone || undefined,
      subject: newConversation.subject,
      category: newConversation.category || undefined,
      priority: newConversation.priority,
      initial_message: newConversation.initial_message || undefined,
    });

    setNewConversation({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      subject: "",
      category: "",
      priority: "medium",
      initial_message: "",
    });
    setNewConversationDialogOpen(false);
  };

  const handleStatusChange = (convId: string, status: LiveChatConversation["status"]) => {
    updateConversationStatus({ id: convId, status });
    if (selectedConversation?.id === convId) {
      setSelectedConversation({ ...selectedConversation, status });
    }
  };

  const handleDelete = (convId: string) => {
    deleteConversation(convId);
    if (selectedConversation?.id === convId) {
      setSelectedConversation(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {allTags.length > 0 && (
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {agents.map((agent) => (
              <SelectItem key={agent.user_id} value={agent.user_id}>
                {agent.full_name || agent.email || "Agent"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setNewConversationDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat Area */}
      <div className="grid lg:grid-cols-3 gap-4 min-h-[400px] lg:h-[600px]">
        {/* Conversation List */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="pb-3 px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px] lg:h-[520px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No conversations</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation?.id === conv.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.customer_avatar || undefined} />
                        <AvatarFallback>{conv.customer_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{conv.customer_name}</p>
                          {conv.unread_count > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                            >
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.subject}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={statusConfig[conv.status].color} variant="secondary">
                            {statusConfig[conv.status].label}
                          </Badge>
                          {conv.assigned_to && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 dark:bg-blue-900/20">
                              <UserPlus className="h-2.5 w-2.5 mr-1" />
                              {agents.find(a => a.user_id === conv.assigned_to)?.full_name?.split(' ')[0] || 'Agent'}
                            </Badge>
                          )}
                          {conv.tags && conv.tags.length > 0 && (
                            <div className="flex gap-1">
                              {conv.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {conv.tags.length > 2 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  +{conv.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {format(new Date(conv.updated_at), "dd MMM, hh:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Messages Area */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
          {selectedConversation ? (
            <ChatArea
              conversation={selectedConversation}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              onTagsChange={(tags) => updateConversationTags({ id: selectedConversation.id, tags })}
              onNotesChange={(notes) => updateCustomerNotes({ id: selectedConversation.id, notes })}
              onAgentAssign={handleAgentAssign}
              agents={agents}
            />
          ) : (
            <CardContent className="h-full flex items-center justify-center min-h-[400px]">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationDialogOpen} onOpenChange={setNewConversationDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>Start a new conversation with customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Customer Name *</Label>
              <Input
                value={newConversation.customer_name}
                onChange={(e) => setNewConversation({ ...newConversation, customer_name: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newConversation.customer_email}
                onChange={(e) => setNewConversation({ ...newConversation, customer_email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input
                value={newConversation.customer_phone}
                onChange={(e) => setNewConversation({ ...newConversation, customer_phone: e.target.value })}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={newConversation.subject}
                onChange={(e) => setNewConversation({ ...newConversation, subject: e.target.value })}
                placeholder="Conversation subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Initial Message (Optional)</Label>
              <Textarea
                value={newConversation.initial_message}
                onChange={(e) => setNewConversation({ ...newConversation, initial_message: e.target.value })}
                placeholder="Customer's first message..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={newConversation.category}
                  onChange={(e) => setNewConversation({ ...newConversation, category: e.target.value })}
                  placeholder="e.g., Order, Return"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newConversation.priority}
                  onValueChange={(value) =>
                    setNewConversation({ ...newConversation, priority: value as LiveChatConversation["priority"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewConversationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateConversation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ChatAreaProps {
  conversation: LiveChatConversation;
  onStatusChange: (id: string, status: LiveChatConversation["status"]) => void;
  onDelete: (id: string) => void;
  onTagsChange: (tags: string[]) => void;
  onNotesChange: (notes: string) => void;
  onAgentAssign: (id: string, agentId: string | null) => void;
  agents: Agent[];
}

function ChatArea({ conversation, onStatusChange, onDelete, onTagsChange, onNotesChange, onAgentAssign, agents }: ChatAreaProps) {
  const { messages, sendMessage, markAsRead, isSending, otherTyping, startTyping, stopTyping, uploadFile } = useLiveChatMessages(conversation.id);
  const { getByShortcut } = useCannedResponses();
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const { showNotification, playNotificationSound, requestPermission } = useChatNotifications();

  // Request notification permission
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // Show notification on new customer messages
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current && prevMessagesLengthRef.current > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.sender === "customer") {
        playNotificationSound();
        showNotification(`New message from ${conversation.customer_name}`, {
          body: latestMessage.content.substring(0, 100),
          tag: `chat-${conversation.id}`,
        });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, showNotification, playNotificationSound, conversation.customer_name, conversation.id]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (conversation.unread_count > 0) {
      markAsRead();
    }
  }, [conversation.id, conversation.unread_count, markAsRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, otherTyping]);

  // Handle input change with typing indicator and shortcut detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Check for canned response shortcut
    if (value.startsWith("/") && value.endsWith(" ")) {
      const shortcut = value.trim();
      const cannedResponse = getByShortcut(shortcut);
      if (cannedResponse) {
        setNewMessage(cannedResponse.content);
        startTyping();
        return;
      }
    }
    
    setNewMessage(value);
    startTyping();
  };

  // Handle emoji click
  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    startTyping();
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const uploadedAttachments: ChatAttachment[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB`);
        continue;
      }

      const attachment = await uploadFile(file);
      if (attachment) {
        uploadedAttachments.push(attachment);
      }
    }

    setAttachments((prev) => [...prev, ...uploadedAttachments]);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || isSending) return;
    await stopTyping();
    sendMessage({ content: newMessage.trim(), sender: "agent", attachments });
    setNewMessage("");
    setAttachments([]);
    setShowEmojiPicker(false);
  };

  return (
    <>
      <CardHeader className="border-b px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={conversation.customer_avatar || undefined} />
              <AvatarFallback>{conversation.customer_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base sm:text-lg">{conversation.customer_name}</CardTitle>
              <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[120px] sm:max-w-none">{conversation.customer_email}</span>
                </span>
                {conversation.customer_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {conversation.customer_phone}
                  </span>
                )}
              </CardDescription>
              {/* Tags inline display */}
              {conversation.tags && conversation.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {conversation.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] px-1 py-0">
                      <Tag className="h-2 w-2 mr-0.5" />
                      {tag}
                    </Badge>
                  ))}
                  {conversation.tags.length > 3 && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      +{conversation.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Agent Assignment */}
            <Select
              value={conversation.assigned_to || "unassigned"}
              onValueChange={(value) => onAgentAssign(conversation.id, value === "unassigned" ? null : value)}
            >
              <SelectTrigger className="w-[160px]">
                <UserPlus className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.user_id} value={agent.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={agent.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(agent.full_name || agent.email || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{agent.full_name || agent.email || "Agent"}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={conversation.status}
              onValueChange={(value) => onStatusChange(conversation.id, value as LiveChatConversation["status"])}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Customer Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(conversation.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tags and Notes Section */}
        <div className="mt-3 pt-3 border-t space-y-3">
          <div className="flex items-start gap-2">
            <Tag className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <ConversationTagsEditor
                tags={conversation.tags || []}
                onTagsChange={onTagsChange}
              />
            </div>
          </div>
          <CustomerNotesEditor
            notes={conversation.customer_notes}
            onNotesChange={onNotesChange}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-[300px] lg:h-[420px]">
        <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
          <div className="space-y-3 sm:space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No messages yet</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "agent" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                      message.sender === "agent" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="space-y-2 mb-2">
                        {message.attachments.map((att, idx) => (
                          <a
                            key={idx}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            {att.type.startsWith("image/") ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="max-w-full rounded-md max-h-48 object-cover"
                              />
                            ) : (
                              <div className={`flex items-center gap-2 p-2 rounded ${
                                message.sender === "agent" ? "bg-primary-foreground/10" : "bg-background"
                              }`}>
                                <FileText className="h-4 w-4 flex-shrink-0" />
                                <span className="text-xs truncate">{att.name}</span>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                    {message.content && (
                      <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 ${
                        message.sender === "agent" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      <span className="text-[10px] sm:text-xs">
                        {format(new Date(message.created_at), "dd MMM, hh:mm a")}
                      </span>
                      {message.sender === "agent" && (
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

            {/* Typing Indicator */}
            {otherTyping && otherTyping.isTyping && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{otherTyping.name} is typing...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="px-3 sm:px-4 py-2 border-t">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="relative group">
                  {att.type.startsWith("image/") ? (
                    <img src={att.url} alt={att.name} className="h-16 w-16 object-cover rounded-md" />
                  ) : (
                    <div className="h-16 w-16 flex items-center justify-center bg-muted rounded-md">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <button
                    onClick={() => removeAttachment(idx)}
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-2 sm:p-4 border-t">
          <div className="flex gap-1 sm:gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden sm:flex h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9">
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 border-0" side="top" align="start">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme={Theme.AUTO}
                  width={350}
                  height={400}
                  searchPlaceholder="Search emoji..."
                  previewConfig={{ showPreview: false }}
                />
              </PopoverContent>
            </Popover>
            <QuickReplyPicker onSelect={(content) => setNewMessage(content)} />
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              onBlur={() => stopTyping()}
              className="flex-1"
              disabled={isSending}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4" 
              disabled={isSending || isUploading || (!newMessage.trim() && attachments.length === 0)}
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
}
