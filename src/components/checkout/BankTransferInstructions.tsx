import { useState } from "react";
import { Copy, Check, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { EnabledPaymentMethod } from "@/hooks/useEnabledPaymentMethods";

interface BankTransferInstructionsProps {
  paymentMethod: EnabledPaymentMethod;
  transactionId: string;
  onTransactionIdChange: (value: string) => void;
}

export function BankTransferInstructions({ 
  paymentMethod, 
  transactionId, 
  onTransactionIdChange 
}: BankTransferInstructionsProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  if (paymentMethod.bank_accounts.length === 0) {
    return (
      <div className="mt-4 p-4 bg-warning/10 rounded-lg border border-warning/20">
        <p className="text-sm text-warning">
          ⚠️ কোনো ব্যাংক একাউন্ট configure করা হয়নি। অনুগ্রহ করে অন্য পেমেন্ট মেথড ব্যবহার করুন।
        </p>
      </div>
    );
  }

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success("কপি হয়েছে!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-4 mt-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-2">
        {paymentMethod.logo_url ? (
          <img 
            src={paymentMethod.logo_url} 
            alt={paymentMethod.name} 
            className="h-8 w-8 object-contain rounded"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-white" />
          </div>
        )}
        <div>
          <p className="font-semibold">{paymentMethod.name}</p>
          <p className="text-xs text-muted-foreground">
            {paymentMethod.bank_accounts.length} টি ব্যাংক একাউন্ট
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {paymentMethod.bank_accounts.map((account, index) => (
          <Card key={account.id || index} className="overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">{account.bank_name}</span>
                </div>
                {account.branch_name && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {account.branch_name}
                  </span>
                )}
              </div>
              
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Name</p>
                    <p className="font-medium">{account.account_name}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.account_name, `name-${index}`)}
                  >
                    {copiedField === `name-${index}` ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-mono font-medium">{account.account_number}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(account.account_number, `number-${index}`)}
                  >
                    {copiedField === `number-${index}` ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {(account.routing_number || account.swift_code) && (
                  <div className="flex gap-2">
                    {account.routing_number && (
                      <div className="flex-1 p-2 bg-background rounded border">
                        <p className="text-xs text-muted-foreground">Routing</p>
                        <p className="font-mono text-sm">{account.routing_number}</p>
                      </div>
                    )}
                    {account.swift_code && (
                      <div className="flex-1 p-2 bg-background rounded border">
                        <p className="text-xs text-muted-foreground">SWIFT</p>
                        <p className="font-mono text-sm">{account.swift_code}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-sm text-muted-foreground bg-warning/10 p-3 rounded-lg border border-warning/20">
        <p className="font-medium text-warning mb-1">🏦 কিভাবে পেমেন্ট করবেন:</p>
        <p className="text-warning/80">
          যেকোনো একটি ব্যাংক একাউন্টে টাকা ট্রান্সফার করুন → Transaction Reference নম্বর সংরক্ষণ করুন
        </p>
      </div>

      <div>
        <Label htmlFor="transactionId" className="text-sm font-medium">
          Transaction Reference / Receipt No. *
        </Label>
        <Input
          id="transactionId"
          value={transactionId}
          onChange={(e) => onTransactionIdChange(e.target.value.toUpperCase())}
          placeholder="যেমন: TRF123456789"
          className="mt-1 font-mono"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          ব্যাংক ট্রান্সফার করার পর আপনি যে Reference Number পাবেন সেটি এখানে দিন
        </p>
      </div>
    </div>
  );
}
