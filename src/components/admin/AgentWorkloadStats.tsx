import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageSquare, 
  Tag, 
  CheckCircle, 
  Circle,
  TrendingUp,
} from "lucide-react";
import { useAgentMetrics } from "@/hooks/useAgentMetrics";

export function AgentWorkloadStats() {
  const { agentMetrics, summary, isLoading } = useAgentMetrics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const maxAssigned = Math.max(...agentMetrics.map((a) => a.totalAssigned), 1);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">মোট এজেন্ট</p>
                <p className="text-2xl font-bold">{summary.totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <Circle className="h-5 w-5 text-green-600 fill-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">অনলাইন</p>
                <p className="text-2xl font-bold">{summary.onlineAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">মোট অ্যাসাইনড</p>
                <p className="text-2xl font-bold">{summary.totalAssigned}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">আজ সমাধান</p>
                <p className="text-2xl font-bold">{summary.resolvedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">এজেন্ট ওয়ার্কলোড</CardTitle>
          <CardDescription>
            প্রতিটি এজেন্টের অ্যাসাইনড চ্যাট এবং টিকেট
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>কোনো এজেন্ট নেই</p>
            </div>
          ) : (
            <div className="space-y-4">
              {agentMetrics.map((agent) => {
                const workloadPercent = (agent.totalAssigned / maxAssigned) * 100;
                
                return (
                  <div key={agent.user_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={agent.avatar_url || undefined} />
                            <AvatarFallback>
                              {(agent.full_name || agent.email || "A").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span 
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                              agent.isOnline ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">
                            {agent.full_name || agent.email || "এজেন্ট"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {agent.assignedChats} চ্যাট
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {agent.assignedTickets} টিকেট
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {agent.totalAssigned} অ্যাসাইনড
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className="text-xs text-emerald-600 border-emerald-300"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {agent.resolvedToday} আজ
                        </Badge>
                      </div>
                    </div>
                    <Progress value={workloadPercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
