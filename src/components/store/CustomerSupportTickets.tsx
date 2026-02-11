import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  Inbox,
  ArrowUpRight,
  Send,
  MessageSquare,
  TicketIcon
} from "lucide-react";
import { useCustomerTickets, useCustomerTicketReplies, type CustomerTicket } from "@/hooks/useCustomerTickets";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const statusConfig = {
  open: { label: "ওপেন", labelEn: "Open", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Inbox },
  in_progress: { label: "প্রগ্রেসে", labelEn: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: ArrowUpRight },
  waiting: { label: "অপেক্ষায়", labelEn: "Waiting", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Clock },
  resolved: { label: "সমাধান", labelEn: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  closed: { label: "বন্ধ", labelEn: "Closed", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle },
};

const priorityConfig = {
  low: { label: "কম", labelEn: "Low" },
  medium: { label: "মাঝারি", labelEn: "Medium" },
  high: { label: "উচ্চ", labelEn: "High" },
  urgent: { label: "জরুরি", labelEn: "Urgent" },
};

export function CustomerSupportTickets() {
  const { tickets, isLoading, createTicket, isCreating } = useCustomerTickets();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<CustomerTicket | null>(null);
  
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium" as CustomerTicket['priority'],
  });

  const handleCreateTicket = () => {
    if (!newTicket.subject.trim()) return;

    createTicket({
      subject: newTicket.subject,
      description: newTicket.description || undefined,
      category: newTicket.category || undefined,
      priority: newTicket.priority,
    });

    setNewTicket({
      subject: "",
      description: "",
      category: "",
      priority: "medium",
    });
    setCreateDialogOpen(false);
  };

  const handleViewDetails = (ticket: CustomerTicket) => {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Support Tickets
          </CardTitle>
          <CardDescription>
            Get help from our support team
          </CardDescription>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and our team will respond shortly
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input 
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  placeholder="Provide more details about your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={newTicket.category}
                    onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Order Issue">Order Issue</SelectItem>
                      <SelectItem value="Delivery">Delivery</SelectItem>
                      <SelectItem value="Payment">Payment</SelectItem>
                      <SelectItem value="Return/Refund">Return/Refund</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Account">Account</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select 
                    value={newTicket.priority}
                    onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as CustomerTicket['priority'] })}
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
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateTicket} disabled={isCreating || !newTicket.subject.trim()}>
                {isCreating ? "Creating..." : "Create Ticket"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No support tickets yet</p>
            <p className="text-sm">Create a ticket if you need help</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status];
              const StatusIcon = status.icon;
              
              return (
                <div 
                  key={ticket.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetails(ticket)}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-full ${status.color}`}>
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
                        <Badge className={status.color} variant="secondary">
                          {status.labelEn}
                        </Badge>
                        {ticket.category && (
                          <Badge variant="outline" className="text-xs">{ticket.category}</Badge>
                        )}
                      </div>
                      <h4 className="font-medium truncate">{ticket.subject}</h4>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(ticket.created_at), "MMM dd, yyyy 'at' hh:mm a")}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog 
        ticket={selectedTicket}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </Card>
  );
}

// Ticket Detail Dialog Component
function TicketDetailDialog({ 
  ticket, 
  open, 
  onOpenChange 
}: { 
  ticket: CustomerTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { replies, createReply, isCreatingReply } = useCustomerTicketReplies(ticket?.id || null);
  const [replyContent, setReplyContent] = useState("");

  const handleSendReply = () => {
    if (!replyContent.trim() || !ticket) return;

    createReply({ content: replyContent });
    setReplyContent("");
  };

  if (!ticket) return null;

  const status = statusConfig[ticket.status];
  const canReply = ticket.status !== 'closed' && ticket.status !== 'resolved';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
            <Badge className={status.color}>{status.labelEn}</Badge>
            {ticket.category && <Badge variant="outline">{ticket.category}</Badge>}
          </div>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription>
            Created on {format(new Date(ticket.created_at), "MMMM dd, yyyy 'at' hh:mm a")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Original Message */}
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="text-sm">{ticket.description || "No description provided"}</p>
          </div>

          {/* Replies */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {replies.map((reply) => (
                <div 
                  key={reply.id} 
                  className={`flex gap-3 ${reply.sender_type === 'customer' ? 'justify-end' : ''}`}
                >
                  {reply.sender_type === 'admin' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">S</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] ${reply.sender_type === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                    <p className="text-sm">{reply.message}</p>
                    <p className={`text-xs mt-1 ${reply.sender_type === 'customer' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {reply.sender_type === 'admin' ? 'Support Team' : 'You'} • {format(new Date(reply.created_at), "hh:mm a")}
                    </p>
                  </div>
                  {reply.sender_type === 'customer' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>Me</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reply Input */}
          {canReply ? (
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <Textarea 
                placeholder="Type your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={2}
                className="resize-none"
              />
              <Button 
                onClick={handleSendReply} 
                disabled={!replyContent.trim() || isCreatingReply}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t text-center text-sm text-muted-foreground">
              This ticket has been {ticket.status}. Create a new ticket if you need further assistance.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
