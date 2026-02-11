import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { 
  Trash2, 
  X,
  UserPlus,
  Clock,
} from "lucide-react";
import { useState } from "react";
import { Agent } from "@/hooks/useAgents";

export type BulkStatus = "open" | "pending" | "resolved" | "closed" | "in_progress" | "waiting";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkStatusChange?: (status: BulkStatus) => void;
  onBulkAssign?: (agentId: string | null) => void;
  agents?: Agent[];
  showStatusOptions?: BulkStatus[];
  isDeleting?: boolean;
  isUpdating?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkStatusChange,
  onBulkAssign,
  agents = [],
  showStatusOptions = ["open", "pending", "resolved", "closed"],
  isDeleting = false,
  isUpdating = false,
}: BulkActionBarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (selectedCount === 0) return null;

  const statusLabels: Record<BulkStatus, string> = {
    open: "Open",
    pending: "Pending",
    resolved: "Resolved",
    closed: "Closed",
    in_progress: "In Progress",
    waiting: "Waiting",
  };

  const handleDelete = () => {
    onBulkDelete?.();
    setDeleteDialogOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="h-7 px-3">
            {selectedCount} selected
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-7 px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Status Change */}
        {onBulkStatusChange && (
          <Select
            onValueChange={(value) => onBulkStatusChange(value as BulkStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[150px] h-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Change Status</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {showStatusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Agent Assign */}
        {onBulkAssign && agents.length > 0 && (
          <Select
            onValueChange={(value) => 
              onBulkAssign(value === "unassigned" ? null : value)
            }
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[150px] h-8">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Assign</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassign</SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.user_id} value={agent.user_id}>
                  {agent.full_name || agent.email || "Agent"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Delete */}
        {onBulkDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            className="h-8"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmModal
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Items"
        description={`Are you sure you want to delete ${selectedCount} items? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </>
  );
}
