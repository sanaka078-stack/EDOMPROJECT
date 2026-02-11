import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  Reply,
  Send,
  User,
  FileText,
  Loader2,
  MessageSquare,
} from "lucide-react";

interface EmailReply {
  id: string;
  reply_subject: string;
  reply_content: string;
  created_at: string;
  replied_by?: string;
  recipient_email?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_text: string;
  body_html?: string;
}

interface EmailThreadViewProps {
  originalMessage: {
    id: string;
    from_name: string;
    from_email: string;
    subject?: string;
    message: string;
    created_at: string;
    phone?: string;
  };
  replies: EmailReply[];
  templates?: EmailTemplate[];
  onSendReply: (subject: string, content: string) => Promise<void>;
  isLoading?: boolean;
  isSending?: boolean;
}

export function EmailThreadView({
  originalMessage,
  replies,
  templates = [],
  onSendReply,
  isLoading = false,
  isSending = false,
}: EmailThreadViewProps) {
  const [replySubject, setReplySubject] = useState(`Re: ${originalMessage.subject || "Message"}`);
  const [replyContent, setReplyContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setReplySubject(template.subject.replace("{original_subject}", originalMessage.subject || ""));
      setReplyContent(template.body_text
        .replace("{customer_name}", originalMessage.from_name)
        .replace("{original_message}", originalMessage.message)
      );
      setSelectedTemplate(templateId);
    }
  };

  const handleSend = async () => {
    if (!replyContent.trim()) return;
    await onSendReply(replySubject, replyContent);
    setReplyContent("");
    setSelectedTemplate("");
  };

  const toggleReply = (id: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedReplies(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Original Message */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{originalMessage.from_name}</p>
                <p className="text-sm text-muted-foreground">{originalMessage.from_email}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-1">মূল মেসেজ</Badge>
              <p className="text-xs text-muted-foreground">
                {format(new Date(originalMessage.created_at), "d MMM yyyy, h:mm a", { locale: bn })}
              </p>
            </div>
          </div>

          {originalMessage.subject && (
            <p className="font-medium mb-2">বিষয়: {originalMessage.subject}</p>
          )}

          <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
            {originalMessage.message}
          </div>

          {originalMessage.phone && (
            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {originalMessage.phone}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Reply Thread */}
      {replies.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            রিপ্লাই থ্রেড ({replies.length})
          </p>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {replies.map((reply, index) => (
                <Collapsible
                  key={reply.id}
                  open={expandedReplies.has(reply.id)}
                  onOpenChange={() => toggleReply(reply.id)}
                >
                  <Card className="overflow-hidden">
                    <CollapsibleTrigger asChild>
                      <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Reply className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm truncate max-w-[200px]">
                              {reply.reply_subject}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reply.created_at), "d MMM, h:mm a", { locale: bn })}
                            </span>
                            {expandedReplies.has(reply.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Separator />
                      <div className="p-3 bg-muted/30">
                        <p className="text-sm whitespace-pre-wrap">{reply.reply_content}</p>
                        {reply.recipient_email && (
                          <p className="text-xs text-muted-foreground mt-2">
                            প্রেরিত: {reply.recipient_email}
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Separator />

      {/* Reply Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium flex items-center gap-2">
            <Reply className="h-4 w-4" />
            নতুন রিপ্লাই
          </p>
          {templates.length > 0 && (
            <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <SelectTrigger className="w-[200px]">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="টেমপ্লেট নির্বাচন" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>বিষয়</Label>
            <Input
              value={replySubject}
              onChange={(e) => setReplySubject(e.target.value)}
              placeholder="রিপ্লাই বিষয়"
            />
          </div>

          <div className="space-y-2">
            <Label>মেসেজ</Label>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="আপনার রিপ্লাই লিখুন..."
              rows={6}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            প্রাপক: {originalMessage.from_email}
          </p>
          <Button onClick={handleSend} disabled={!replyContent.trim() || isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            পাঠান
          </Button>
        </div>
      </div>
    </div>
  );
}
