import { useState, useRef, TouchEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import {
  Archive,
  Mail,
  MailOpen,
  Trash2,
  Reply,
  MoreHorizontal,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { ResponseTimeIndicator } from "./ResponseTimeIndicator";

interface MessageItem {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  subject?: string;
  preview: string;
  createdAt: string;
  isRead: boolean;
  isReplied?: boolean;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: string;
  unreadCount?: number;
  firstResponseAt?: string | null;
}

interface MobileMessageListProps {
  items: MessageItem[];
  onItemClick: (item: MessageItem) => void;
  onMarkAsRead?: (id: string) => void;
  onMarkAsUnread?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onReply?: (item: MessageItem) => void;
  showResponseTime?: boolean;
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function MobileMessageList({
  items,
  onItemClick,
  onMarkAsRead,
  onMarkAsUnread,
  onDelete,
  onArchive,
  onReply,
  showResponseTime = false,
}: MobileMessageListProps) {
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MessageItem | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent, id: string) => {
    touchEndX.current = e.targetTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > 50) {
      setSwipedItemId(id);
    }
  };

  const handleTouchEnd = (item: MessageItem) => {
    const diff = touchStartX.current - touchEndX.current;

    if (diff > 100 && onDelete) {
      // Swipe left - delete
      onDelete(item.id);
    } else if (diff < -100 && onArchive) {
      // Swipe right - archive
      onArchive(item.id);
    }

    setSwipedItemId(null);
  };

  const handleLongPress = (item: MessageItem) => {
    setSelectedItem(item);
    setActionSheetOpen(true);
  };

  return (
    <>
      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "relative overflow-hidden",
              swipedItemId === item.id && "bg-muted/50"
            )}
          >
            {/* Swipe Action Indicators */}
            <div className="absolute inset-y-0 left-0 w-16 bg-emerald-500 flex items-center justify-center opacity-0 transition-opacity"
              style={{ opacity: swipedItemId === item.id ? 0.8 : 0 }}
            >
              <Archive className="h-5 w-5 text-white" />
            </div>
            <div className="absolute inset-y-0 right-0 w-16 bg-red-500 flex items-center justify-center opacity-0 transition-opacity"
              style={{ opacity: swipedItemId === item.id ? 0.8 : 0 }}
            >
              <Trash2 className="h-5 w-5 text-white" />
            </div>

            {/* Message Item */}
            <div
              className={cn(
                "p-4 bg-background transition-transform touch-pan-y cursor-pointer",
                !item.isRead && "bg-primary/5"
              )}
              onClick={() => onItemClick(item)}
              onTouchStart={handleTouchStart}
              onTouchMove={(e) => handleTouchMove(e, item.id)}
              onTouchEnd={() => handleTouchEnd(item)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(item);
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={item.avatar} />
                  <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <p className="font-medium truncate">{item.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {format(new Date(item.createdAt), "d MMM", { locale: bn })}
                    </span>
                  </div>

                  {item.subject && (
                    <p className="text-sm font-medium truncate mb-0.5">{item.subject}</p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.preview}
                  </p>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.priority && item.priority !== "medium" && (
                      <Badge variant="secondary" className={cn("text-xs", priorityColors[item.priority])}>
                        {item.priority === "urgent" ? "জরুরি" : item.priority === "high" ? "উচ্চ" : "কম"}
                      </Badge>
                    )}

                    {item.isReplied !== undefined && (
                      <Badge
                        variant={item.isReplied ? "default" : "outline"}
                        className={cn(
                          "text-xs",
                          item.isReplied
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "text-amber-600 border-amber-300"
                        )}
                      >
                        {item.isReplied ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            উত্তর দেওয়া হয়েছে
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            উত্তর দেওয়া হয়নি
                          </>
                        )}
                      </Badge>
                    )}

                    {item.unreadCount && item.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {item.unreadCount}
                      </Badge>
                    )}

                    {showResponseTime && (
                      <ResponseTimeIndicator
                        createdAt={item.createdAt}
                        firstResponseAt={item.firstResponseAt}
                        size="sm"
                        showLabel={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Sheet */}
      <Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>{selectedItem?.name}</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-4 gap-4 py-6">
            {onReply && (
              <Button
                variant="ghost"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => {
                  if (selectedItem) onReply(selectedItem);
                  setActionSheetOpen(false);
                }}
              >
                <Reply className="h-6 w-6" />
                <span className="text-xs">উত্তর দিন</span>
              </Button>
            )}
            {onMarkAsRead && onMarkAsUnread && (
              <Button
                variant="ghost"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => {
                  if (selectedItem) {
                    selectedItem.isRead
                      ? onMarkAsUnread(selectedItem.id)
                      : onMarkAsRead(selectedItem.id);
                  }
                  setActionSheetOpen(false);
                }}
              >
                {selectedItem?.isRead ? (
                  <>
                    <Mail className="h-6 w-6" />
                    <span className="text-xs">অপঠিত</span>
                  </>
                ) : (
                  <>
                    <MailOpen className="h-6 w-6" />
                    <span className="text-xs">পঠিত</span>
                  </>
                )}
              </Button>
            )}
            {onArchive && (
              <Button
                variant="ghost"
                className="flex-col h-auto py-4 gap-2"
                onClick={() => {
                  if (selectedItem) onArchive(selectedItem.id);
                  setActionSheetOpen(false);
                }}
              >
                <Archive className="h-6 w-6" />
                <span className="text-xs">আর্কাইভ</span>
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                className="flex-col h-auto py-4 gap-2 text-destructive hover:text-destructive"
                onClick={() => {
                  if (selectedItem) onDelete(selectedItem.id);
                  setActionSheetOpen(false);
                }}
              >
                <Trash2 className="h-6 w-6" />
                <span className="text-xs">মুছে ফেলুন</span>
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
