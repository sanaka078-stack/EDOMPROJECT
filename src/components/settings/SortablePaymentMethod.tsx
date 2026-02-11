import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle, Settings2, GripVertical } from "lucide-react";
import { PaymentMethod } from "@/hooks/usePaymentMethods";

interface SortablePaymentMethodProps {
  method: PaymentMethod;
  saving: boolean;
  onConfigure: (method: PaymentMethod) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onToggleTestMode: (id: string, testMode: boolean) => void;
}

export function SortablePaymentMethod({
  method,
  saving,
  onConfigure,
  onToggleEnabled,
  onToggleTestMode,
}: SortablePaymentMethodProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: method.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/30 bg-card ${
        isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        
        {method.logo_url ? (
          <img 
            src={method.logo_url} 
            alt={method.name} 
            className="h-10 w-10 object-contain rounded"
          />
        ) : (
          <span className="text-2xl">{method.icon}</span>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{method.name}</p>
            {method.name_bn && (
              <span className="text-sm text-muted-foreground">({method.name_bn})</span>
            )}
            {method.is_configured ? (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                <AlertCircle className="mr-1 h-3 w-3" />
                Setup Required
              </Badge>
            )}
            {method.test_mode && method.is_enabled && (
              <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                Test Mode
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {method.description}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onConfigure(method)}
          className="gap-1"
        >
          <Settings2 className="h-4 w-4" />
          Configure
        </Button>
        {method.is_configured && method.is_enabled && method.method_id !== "cod" && (
          <div className="flex items-center gap-2">
            <Label htmlFor={`test-${method.method_id}`} className="text-sm text-muted-foreground whitespace-nowrap">
              Test Mode
            </Label>
            <Switch
              id={`test-${method.method_id}`}
              checked={method.test_mode}
              onCheckedChange={(checked) => onToggleTestMode(method.id, checked)}
              disabled={saving}
            />
          </div>
        )}
        <Switch
          checked={method.is_enabled}
          onCheckedChange={(checked) => onToggleEnabled(method.id, checked)}
          disabled={saving || (!method.is_configured && method.method_id !== "cod")}
        />
      </div>
    </div>
  );
}
