import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  User,
  Phone,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PaymentVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    payment_method: string;
    payment_status: string;
    total: number;
    notes: string | null;
    created_at: string;
    payment_verified_at?: string | null;
    payment_verification_notes?: string | null;
  } | null;
  onVerify: (orderId: string, status: 'paid' | 'failed', notes: string) => void;
  isVerifying?: boolean;
}

export function PaymentVerificationModal({
  open,
  onOpenChange,
  order,
  onVerify,
  isVerifying = false,
}: PaymentVerificationModalProps) {
  const [notes, setNotes] = useState("");
  const [selectedAction, setSelectedAction] = useState<'paid' | 'failed' | null>(null);

  // Extract transaction ID from notes if present
  const extractTrxId = (noteText: string | null): string | null => {
    if (!noteText) return null;
    const match = noteText.match(/TrxID:\s*([A-Z0-9]+)/i);
    return match ? match[1] : null;
  };

  const handleVerify = (status: 'paid' | 'failed') => {
    if (!order) return;
    setSelectedAction(status);
    onVerify(order.id, status, notes);
    setNotes("");
    setSelectedAction(null);
  };

  const handleClose = () => {
    setNotes("");
    setSelectedAction(null);
    onOpenChange(false);
  };

  if (!order) return null;

  const trxId = extractTrxId(order.notes);
  const isAlreadyVerified = order.payment_verified_at !== null && order.payment_verified_at !== undefined;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Payment Verification
          </DialogTitle>
          <DialogDescription>
            Verify payment for order {order.order_number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Order</span>
              <span className="font-medium">{order.order_number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-bold text-lg">৳{order.total.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.customer_phone}</span>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Payment Method</span>
              <Badge variant="outline">{order.payment_method}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status</span>
              <Badge
                variant="outline"
                className={cn(
                  order.payment_status === 'paid' && "bg-success/10 text-success border-success/20",
                  order.payment_status === 'pending' && "bg-warning/10 text-warning border-warning/20",
                  order.payment_status === 'failed' && "bg-destructive/10 text-destructive border-destructive/20"
                )}
              >
                {order.payment_status === 'paid' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                {order.payment_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                {order.payment_status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Badge>
            </div>
            {trxId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transaction ID</span>
                <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{trxId}</code>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order Date</span>
              <span className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          </div>

          {/* Customer Notes */}
          {order.notes && (
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Customer Notes</span>
              </div>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Already Verified Warning */}
          {isAlreadyVerified && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Already Verified</p>
                <p className="text-muted-foreground">
                  Verified on {format(new Date(order.payment_verified_at!), 'MMM dd, yyyy HH:mm')}
                </p>
                {order.payment_verification_notes && (
                  <p className="mt-1 text-muted-foreground italic">
                    "{order.payment_verification_notes}"
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Verification Notes */}
          <div className="space-y-2">
            <Label htmlFor="verification-notes">Verification Notes (Optional)</Label>
            <Textarea
              id="verification-notes"
              placeholder="Add any notes about this verification..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleVerify('failed')}
            disabled={isVerifying}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            {isVerifying && selectedAction === 'failed' ? 'Processing...' : 'Reject'}
          </Button>
          <Button
            onClick={() => handleVerify('paid')}
            disabled={isVerifying}
            className="flex-1 bg-success hover:bg-success/90"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {isVerifying && selectedAction === 'paid' ? 'Processing...' : 'Verify'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
