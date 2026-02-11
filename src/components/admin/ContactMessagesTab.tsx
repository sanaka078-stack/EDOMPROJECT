import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContactMessages, ContactMessage } from "@/hooks/useContactMessages";
import { useContactMessageReplies } from "@/hooks/useContactMessageReplies";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Mail,
  MailOpen,
  Phone,
  Trash2,
  Eye,
  Loader2,
  User,
  Calendar,
  MessageSquare,
  Reply,
  Send,
  CheckCircle2,
  History,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";

export function ContactMessagesTab() {
  const { messages, isLoading, unreadCount, unrepliedCount, markAsRead, markAsUnread, markAsReplied, deleteMessage } = useContactMessages();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read" | "unreplied" | "replied">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  
  // Reply state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Reply history
  const { replies, isLoading: repliesLoading, addReply } = useContactMessageReplies(selectedMessage?.id);

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    switch (filterStatus) {
      case "unread":
        matchesFilter = !msg.is_read;
        break;
      case "read":
        matchesFilter = msg.is_read;
        break;
      case "unreplied":
        matchesFilter = !msg.replied_at;
        break;
      case "replied":
        matchesFilter = !!msg.replied_at;
        break;
    }

    return matchesSearch && matchesFilter;
  });

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
    if (!message.is_read) {
      markAsRead(message.id);
    }
  };

  const handleReplyClick = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplySubject(`Re: Message from ${message.first_name} ${message.last_name}`);
    setReplyMessage("");
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setIsSendingReply(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-contact-reply', {
        body: {
          toEmail: selectedMessage.email,
          toName: `${selectedMessage.first_name} ${selectedMessage.last_name}`,
          subject: replySubject,
          message: replyMessage,
          originalMessage: selectedMessage.message,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to send reply");

      // Save reply history
      await addReply({
        messageId: selectedMessage.id,
        subject: replySubject,
        content: replyMessage,
        recipientEmail: selectedMessage.email,
      });

      // Mark as replied
      markAsReplied(selectedMessage.id);

      toast.success("Reply sent successfully!");
      setReplyDialogOpen(false);
      setReplySubject("");
      setReplyMessage("");
    } catch (error: any) {
      console.error("Error sending reply:", error);
      toast.error(error.message || "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setMessageToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMessage(messageToDelete);
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const repliedCount = messages.filter(m => m.replied_at).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <Mail className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Reply className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unreplied</p>
                <p className="text-2xl font-bold">{unrepliedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Replied</p>
                <p className="text-2xl font-bold">{repliedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            All
          </Button>
          <Button
            variant={filterStatus === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filterStatus === "unreplied" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("unreplied")}
          >
            Unreplied ({unrepliedCount})
          </Button>
          <Button
            variant={filterStatus === "replied" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("replied")}
          >
            Replied ({repliedCount})
          </Button>
        </div>
      </div>

      {/* Messages List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Contact Messages</CardTitle>
          <CardDescription>All messages from the website contact form</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mb-2 opacity-50" />
                <p>No messages found</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 hover:bg-muted/50 transition-colors ${
                      !message.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleViewMessage(message)}
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {!message.is_read && (
                            <span className="h-2 w-2 rounded-full bg-primary" />
                          )}
                          <p className="font-medium">
                            {message.first_name} {message.last_name}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {message.email}
                          </Badge>
                          {message.replied_at ? (
                            <Badge variant="default" className="text-xs bg-emerald-600 hover:bg-emerald-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Replied
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                              Unreplied
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(message.created_at), "d MMM yyyy, h:mm a")}
                          </span>
                          {message.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {message.phone}
                            </span>
                          )}
                          {message.replied_at && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Reply className="h-3 w-3" />
                              Replied: {format(new Date(message.replied_at), "d MMM yyyy, h:mm a")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleReplyClick(message)}
                          title="Reply"
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewMessage(message)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReplyClick(message)}>
                              <Reply className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            {message.is_read ? (
                              <DropdownMenuItem onClick={() => markAsUnread(message.id)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Mark as Unread
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => markAsRead(message.id)}>
                                <MailOpen className="h-4 w-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(message.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message Details</DialogTitle>
            <DialogDescription>
              Message received from contact form
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> Name
                  </p>
                  <p className="font-medium">
                    {selectedMessage.first_name} {selectedMessage.last_name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-4 w-4" /> Email
                  </p>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Phone
                    </p>
                    <p className="font-medium">{selectedMessage.phone}</p>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Date
                  </p>
                  <p className="font-medium">
                    {format(new Date(selectedMessage.created_at), "d MMMM yyyy, h:mm a")}
                  </p>
                </div>
              </div>

              {/* Reply History */}
              {selectedMessage.replied_at && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Reply History</p>
                  </div>
                  
                  {repliesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">No reply history found</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {replies.map((reply) => (
                        <div key={reply.id} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              {reply.reply_subject}
                            </p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(reply.created_at), "d MMM yyyy, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{reply.reply_content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" /> Message
                </p>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleReplyClick(selectedMessage);
                  }}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  {selectedMessage.replied_at ? "Reply Again" : "Reply"}
                </Button>
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5" />
              Send Reply
            </DialogTitle>
            <DialogDescription>
              {selectedMessage && (
                <>
                  Reply to <span className="font-medium">{selectedMessage.first_name} {selectedMessage.last_name}</span>
                  {" "}&lt;{selectedMessage.email}&gt;
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              {/* Original Message Preview */}
              <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                <p className="text-xs text-muted-foreground mb-1">Original message:</p>
                <p className="text-sm line-clamp-3">{selectedMessage.message}</p>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="reply-subject">Subject</Label>
                <Input
                  id="reply-subject"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Reply subject..."
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="reply-message">Your Reply</Label>
                <Textarea
                  id="reply-message"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your reply..."
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyMessage.trim()}
                >
                  {isSendingReply ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
