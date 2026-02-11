import { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Clock, 
  AlertCircle,
  Tag,
  Inbox,
  Bell,
  BellOff,
  Users,
} from "lucide-react";
import { ContactMessagesTab } from "@/components/admin/ContactMessagesTab";
import { LiveChatTab } from "@/components/admin/LiveChatTab";
import { SupportTicketsTab } from "@/components/admin/SupportTicketsTab";
import { AgentWorkloadStats } from "@/components/admin/AgentWorkloadStats";
import { useContactMessages } from "@/hooks/useContactMessages";
import { useLiveChat } from "@/hooks/useLiveChat";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useTabNotifications } from "@/hooks/useTabNotifications";
import { toast } from "sonner";

export default function Messages() {
  const { unreadCount: contactUnreadCount } = useContactMessages();
  const { stats: liveChatStats } = useLiveChat();
  const { stats: ticketStats } = useSupportTickets();
  const { requestPermission, subscribeToNotifications, isSupported } = useChatNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted"
  );
  const [showAgentStats, setShowAgentStats] = useState(false);

  const totalUnread = contactUnreadCount + liveChatStats.unreadMessages + ticketStats.open;
  
  // Use tab notifications hook
  useTabNotifications({ 
    unreadCount: totalUnread, 
    baseTitle: "Messages & Support" 
  });

  // Subscribe to realtime notifications when enabled
  useEffect(() => {
    if (notificationsEnabled) {
      const unsubscribe = subscribeToNotifications();
      return unsubscribe;
    }
  }, [notificationsEnabled, subscribeToNotifications]);

  const stats = {
    totalConversations: liveChatStats.total,
    openConversations: liveChatStats.open,
    totalTickets: ticketStats.total,
    pendingTickets: ticketStats.pending,
    unreadMessages: liveChatStats.unreadMessages,
    contactMessages: contactUnreadCount
  };

  const handleEnableNotifications = async () => {
    if (!isSupported) {
      toast.error("Your browser doesn't support notifications");
      return;
    }

    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      toast.success("Notifications enabled!");
    } else {
      toast.error("Notification permission denied");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Messages & Support</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage customer inquiries and support tickets</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showAgentStats ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAgentStats(!showAgentStats)}
            >
              <Users className="h-4 w-4 mr-2" />
              Agent Stats
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnableNotifications}
              disabled={notificationsEnabled}
            >
              {notificationsEnabled ? (
                <>
                  <Bell className="h-4 w-4 mr-2 text-green-600" />
                  Notifications On
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Agent Stats Section */}
        {showAgentStats && (
          <AgentWorkloadStats />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-primary/10">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Conversations</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Inbox className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Open Chats</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.openConversations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Tickets</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.totalTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Pending Tickets</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.pendingTickets}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-3 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Unread Messages</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.unreadMessages}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="contact" className="space-y-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="contact" className="flex-1 sm:flex-none">
              Contact Messages
              {stats.contactMessages > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {stats.contactMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1 sm:flex-none">Live Chat</TabsTrigger>
            <TabsTrigger value="tickets" className="flex-1 sm:flex-none">
              Support Tickets
              {ticketStats.open > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {ticketStats.open}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Contact Messages Tab */}
          <TabsContent value="contact">
            <ContactMessagesTab />
          </TabsContent>

          {/* Live Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <LiveChatTab />
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <SupportTicketsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
