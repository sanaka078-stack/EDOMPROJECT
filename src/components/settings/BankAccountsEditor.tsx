import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Edit2, Save, X, Building2 } from "lucide-react";
import { BankAccount } from "@/data/paymentMethodDefinitions";

interface BankAccountsEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function BankAccountsEditor({ value, onChange }: BankAccountsEditorProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch {
      return [];
    }
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<BankAccount>>({});

  const updateAccounts = (newAccounts: BankAccount[]) => {
    setAccounts(newAccounts);
    onChange(JSON.stringify(newAccounts));
  };

  const handleAdd = () => {
    if (!formData.bank_name || !formData.account_number || !formData.account_name) {
      return;
    }
    const newAccount: BankAccount = {
      id: crypto.randomUUID(),
      bank_name: formData.bank_name || "",
      branch_name: formData.branch_name || "",
      account_name: formData.account_name || "",
      account_number: formData.account_number || "",
      routing_number: formData.routing_number,
      swift_code: formData.swift_code,
    };
    updateAccounts([...accounts, newAccount]);
    setFormData({});
    setShowAddForm(false);
  };

  const handleEdit = (account: BankAccount) => {
    setEditingId(account.id);
    setFormData(account);
  };

  const handleSaveEdit = () => {
    if (!editingId || !formData.bank_name || !formData.account_number) return;
    updateAccounts(
      accounts.map((acc) =>
        acc.id === editingId ? { ...acc, ...formData } as BankAccount : acc
      )
    );
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    updateAccounts(accounts.filter((acc) => acc.id !== id));
  };

  const renderForm = (isEditing: boolean) => (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Bank Name *</Label>
          <Input
            placeholder="e.g., Dutch Bangla Bank"
            value={formData.bank_name || ""}
            onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Branch Name</Label>
          <Input
            placeholder="e.g., Gulshan Branch"
            value={formData.branch_name || ""}
            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Account Name *</Label>
          <Input
            placeholder="Account holder name"
            value={formData.account_name || ""}
            onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Account Number *</Label>
          <Input
            placeholder="1234567890"
            value={formData.account_number || ""}
            onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Routing Number</Label>
          <Input
            placeholder="Optional"
            value={formData.routing_number || ""}
            onChange={(e) => setFormData({ ...formData, routing_number: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">SWIFT Code</Label>
          <Input
            placeholder="Optional"
            value={formData.swift_code || ""}
            onChange={(e) => setFormData({ ...formData, swift_code: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setShowAddForm(false);
            setEditingId(null);
            setFormData({});
          }}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={isEditing ? handleSaveEdit : handleAdd}
          disabled={!formData.bank_name || !formData.account_number || !formData.account_name}
        >
          <Save className="h-4 w-4 mr-1" />
          {isEditing ? "Save Changes" : "Add Bank"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {accounts.length === 0 && !showAddForm && (
        <div className="text-center py-6 border-2 border-dashed rounded-lg">
          <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No bank accounts added yet</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bank Account
          </Button>
        </div>
      )}

      {accounts.map((account) => (
        <Card key={account.id} className="overflow-hidden">
          {editingId === account.id ? (
            <CardContent className="p-3">
              {renderForm(true)}
            </CardContent>
          ) : (
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-medium">{account.bank_name}</span>
                    {account.branch_name && (
                      <span className="text-xs text-muted-foreground">
                        ({account.branch_name})
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    <p>{account.account_name}</p>
                    <p className="font-mono">{account.account_number}</p>
                    {(account.routing_number || account.swift_code) && (
                      <p className="text-xs mt-1">
                        {account.routing_number && `Routing: ${account.routing_number}`}
                        {account.routing_number && account.swift_code && " • "}
                        {account.swift_code && `SWIFT: ${account.swift_code}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(account)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {showAddForm && renderForm(false)}

      {accounts.length > 0 && !showAddForm && !editingId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Bank
        </Button>
      )}
    </div>
  );
}
