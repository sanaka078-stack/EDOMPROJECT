import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Search, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Mail,
  Filter,
  MoreVertical,
  Inbox,
  ArrowUpRight,
  Send,
  Trash2,
  UserPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { useSupportTickets, useTicketReplies, type SupportTicket } from "@/hooks/useSupportTickets";
import { useAgents } from "@/hooks/useAgents";
import { BulkActionBar, BulkStatus } from "./BulkActionBar";
import { format } from "date-fns";

const statusConfig = {
  open: { label: "Open", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Inbox },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: ArrowUpRight },
  waiting: { label: "Waiting", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Clock },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
};

export function SupportTicketsTab() {
  const { 
    tickets, 
    isLoading, 
    createTicket, 
    updateTicketStatus, 
    assignTicket,
    deleteTicket,
    bulkDeleteTickets,
    bulkUpdateStatus,
    bulkAssignTickets,
    isCreating,
    isBulkDeleting,
    isBulkUpdating,
  } = useSupportTickets();
  const { agents } = useAgents();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [newTicket, setNewTicket] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    subject: "",
    description: "",
    priority: "medium" as SupportTicket['priority'],
    category: ""
  });

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTickets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTickets.map(t => t.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkDelete = () => {
    bulkDeleteTickets(Array.from(selectedIds));
    clearSelection();
  };

  const handleBulkStatusChange = (status: BulkStatus) => {
    bulkUpdateStatus({ ids: Array.from(selectedIds), status: status as SupportTicket['status'] });
    clearSelection();
  };

  const handleBulkAssign = (agentId: string | null) => {
    bulkAssignTickets({ ids: Array.from(selectedIds), assigned_to: agentId });
    clearSelection();
  };

  const handleCreateTicket = () => {
    if (!newTicket.customer_name || !newTicket.customer_email || !newTicket.subject) {
      return;
    }

    createTicket({
      customer_name: newTicket.customer_name,
      customer_email: newTicket.customer_email,
      customer_phone: newTicket.customer_phone || undefined,
      subject: newTicket.subject,
      description: newTicket.description || undefined,
      priority: newTicket.priority,
      category: newTicket.category || undefined,
    });

    setNewTicket({
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      subject: "",
      description: "",
      priority: "medium",
      category: ""
    });
    setTicketDialogOpen(false);
  };

  const handleViewDetails = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ticketToDelete) {
      deleteTicket(ticketToDelete);
      setTicketToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ticket ID, customer name or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting">Waiting</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setTicketDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkAssign={handleBulkAssign}
        agents={agents}
        showStatusOptions={["open", "in_progress", "waiting", "resolved", "closed"]}
        isDeleting={isBulkDeleting}
        isUpdating={isBulkUpdating}
      />

      {/* Select All */}
      {filteredTickets.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <Checkbox
            checked={selectedIds.size === filteredTickets.length && filteredTickets.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            Select All ({filteredTickets.length})
          </span>
        </div>
      )}

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No tickets found
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket) => {
            const status = statusConfig[ticket.status];
            const priority = priorityConfig[ticket.priority];
            const StatusIcon = status.icon;
            const assignedAgent = agents.find(a => a.user_id === ticket.assigned_to);
            const isSelected = selectedIds.has(ticket.id);
            
            return (
              <Card key={ticket.id} className={`hover:shadow-md transition-shadow ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelection(ticket.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`p-2 rounded-full ${status.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
                          <Badge className={priority.color} variant="secondary">
                            {priority.label}
                          </Badge>
                          {ticket.category && (
                            <Badge variant="outline">{ticket.category}</Badge>
                          )}
                          {assignedAgent && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {assignedAgent.full_name || assignedAgent.email}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold truncate">{ticket.subject}</h3>
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{ticket.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.customer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {ticket.customer_email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(ticket.created_at), "dd MMM yyyy, hh:mm a")}
                          </span>
                        </div>
                        {ticket.tags && ticket.tags.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {ticket.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={ticket.status}
                        onValueChange={(value) => updateTicketStatus({ id: ticket.id, status: value as SupportTicket['status'] })}
                      >
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="waiting">Waiting</SelectItem>
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
                          <DropdownMenuItem onClick={() => handleViewDetails(ticket)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="p-0">
                            <Select
                              value={ticket.assigned_to || "unassigned"}
                              onValueChange={(value) => assignTicket({ 
                                id: ticket.id, 
                                assigned_to: value === "unassigned" ? null : value 
                              })}
                            >
                              <SelectTrigger className="border-0 shadow-none h-8 px-2">
                                <UserPlus className="h-4 w-4 mr-2" />
                                <span className="text-sm">Assign</span>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {agents.map(agent => (
                                  <SelectItem key={agent.user_id} value={agent.user_id}>
                                    {agent.full_name || agent.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => {
                              setTicketToDelete(ticket.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={ticketDialogOpen} onOpenChange={setTicketDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Support Ticket</DialogTitle>
            <DialogDescription>
              Create a new support ticket for a customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input 
                  placeholder="Enter name"
                  value={newTicket.customer_name}
                  onChange={(e) => setNewTicket({ ...newTicket, customer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="email@example.com"
                  value={newTicket.customer_email}
                  onChange={(e) => setNewTicket({ ...newTicket, customer_email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input 
                placeholder="01XXXXXXXXX"
                value={newTicket.customer_phone}
                onChange={(e) => setNewTicket({ ...newTicket, customer_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input 
                placeholder="Enter ticket subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                placeholder="Enter detailed description..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select 
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket({ ...newTicket, priority: value as SupportTicket['priority'] })}
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
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Delivery">Delivery</SelectItem>
                    <SelectItem value="Payment">Payment</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Account">Account</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTicketDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Dialog */}
      <TicketDetailDialog 
        ticket={selectedTicket}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This ticket and all related replies will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Ticket Detail Dialog Component
function TicketDetailDialog({ 
  ticket, 
  open, 
  onOpenChange 
}: { 
  ticket: SupportTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { replies, createReply, isCreatingReply } = useTicketReplies(ticket?.id || null);
  const [replyContent, setReplyContent] = useState("");

  const handleSendReply = () => {
    if (!replyContent.trim() || !ticket) return;

    createReply({
      ticket_id: ticket.id,
      content: replyContent,
    });
    setReplyContent("");
  };

  if (!ticket) return null;

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_number}</span>
            <Badge className={status.color}>{status.label}</Badge>
            <Badge className={priority.color}>{priority.label}</Badge>
          </div>
          <DialogTitle>{ticket.subject}</DialogTitle>
          <DialogDescription>
            {ticket.customer_name} ({ticket.customer_email})
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Original Message */}
          <div className="bg-muted/50 p-4 rounded-lg mb-4">
            <p className="text-sm">{ticket.description || "No description"}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(ticket.created_at), "dd MMM yyyy, hh:mm a")}
            </p>
          </div>

          {/* Replies */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {replies.map((reply) => (
                <div 
                  key={reply.id} 
                  className={`flex gap-3 ${reply.sender_type === 'admin' ? 'justify-end' : ''}`}
                >
                  {reply.sender_type === 'customer' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{ticket.customer_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[80%] ${reply.sender_type === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg`}>
                    <p className="text-sm">{reply.content}</p>
                    <p className={`text-xs mt-1 ${reply.sender_type === 'admin' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {reply.sender_name || (reply.sender_type === 'admin' ? 'Admin' : ticket.customer_name)} • {format(new Date(reply.created_at), "hh:mm a")}
                    </p>
                  </div>
                  {reply.sender_type === 'admin' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Reply Input */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Textarea 
              placeholder="Write a reply..."
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
