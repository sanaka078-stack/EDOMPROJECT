import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff, Save, Loader2, Upload, X, ImageIcon, CheckCircle2 } from "lucide-react";
import { PaymentMethod, PaymentMethodConfig as PaymentMethodConfigType } from "@/hooks/usePaymentMethods";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BankAccountsEditor } from "./BankAccountsEditor";

interface PaymentMethodConfigProps {
  method: PaymentMethod | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, config: Partial<PaymentMethodConfigType>) => Promise<boolean>;
  onUploadImage: (methodId: string, file: File, prefix?: string) => Promise<string | null>;
}

export function PaymentMethodConfig({ method, open, onOpenChange, onSave, onUploadImage }: PaymentMethodConfigProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Initialize form data when method changes
  useEffect(() => {
    if (method) {
      const initialData: Record<string, string> = {};
      method.configFields.forEach((field) => {
        const value = (method as any)[field.key];
        initialData[field.key] = value || "";
      });
      setFormData(initialData);
    }
  }, [method]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFileSelect = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !method) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading((prev) => ({ ...prev, [key]: true }));

    const prefix = key === "qr_code_url" ? "qr-" : "";
    const publicUrl = await onUploadImage(method.method_id, file, prefix);

    if (publicUrl) {
      handleInputChange(key, publicUrl);
      toast.success("Image uploaded successfully");
    }

    setUploading((prev) => ({ ...prev, [key]: false }));
  };

  const removeImage = (key: string) => {
    handleInputChange(key, "");
    if (fileInputRefs.current[key]) {
      fileInputRefs.current[key]!.value = "";
    }
  };

  const handleSave = async () => {
    if (!method) return;
    
    setSaving(true);
    
    const config: Partial<PaymentMethodConfigType> = {};
    method.configFields.forEach((field) => {
      (config as any)[field.key] = formData[field.key] || null;
    });
    
    const success = await onSave(method.id, config);
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  if (!method) return null;

  const isCOD = method.method_id === "cod";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {formData.logo_url ? (
              <img src={formData.logo_url} alt={method.name} className="h-8 w-8 object-contain rounded" />
            ) : (
              <span className="text-2xl">{method.icon}</span>
            )}
            Configure {method.name}
          </DialogTitle>
          <DialogDescription>
            {method.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dynamic config fields */}
          {method.configFields.length === 0 && (
            <div className="rounded-lg bg-success/10 p-4 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-2" />
              <p className="font-medium">Ready to Use</p>
              <p className="text-sm text-muted-foreground">
                This payment method requires no additional configuration.
              </p>
            </div>
          )}

          {method.configFields.map((field) => {
            // Check if this field depends on another field
            if (field.dependsOn && !formData[field.dependsOn]) {
              return null;
            }

            return (
              <div key={field.key} className="space-y-2">
                {field.type === "switch" ? (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.label_bn && (
                        <p className="text-xs text-muted-foreground">{field.label_bn}</p>
                      )}
                    </div>
                    <Switch
                      id={field.key}
                      checked={formData[field.key] === "true"}
                      onCheckedChange={(checked) => handleInputChange(field.key, checked ? "true" : "false")}
                    />
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.key}>{field.label}</Label>
                    
                    {field.type === "text" && (
                      <Input
                        id={field.key}
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === "number" && (
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData[field.key] || ""}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    )}

                    {field.type === "password" && (
                      <div className="relative">
                        <Input
                          id={field.key}
                          type={showPasswords[field.key] ? "text" : "password"}
                          value={formData[field.key] || ""}
                          onChange={(e) => handleInputChange(field.key, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPasswords((prev) => ({ ...prev, [field.key]: !prev[field.key] }))}
                        >
                          {showPasswords[field.key] ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    )}

                    {field.type === "select" && (
                      <Select 
                        value={formData[field.key] || ""} 
                        onValueChange={(value) => handleInputChange(field.key, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {field.options?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "image" && (
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          {formData[field.key] ? (
                            <div className={`relative ${field.key === "qr_code_url" ? "w-32 h-32" : "w-20 h-20"} rounded-lg border border-border overflow-hidden bg-muted`}>
                              <img 
                                src={formData[field.key]} 
                                alt={field.label} 
                                className="w-full h-full object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={() => removeImage(field.key)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className={`${field.key === "qr_code_url" ? "w-32 h-32" : "w-20 h-20"} rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:border-primary/50 transition-colors`}
                              onClick={() => fileInputRefs.current[field.key]?.click()}
                            >
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              {field.key === "qr_code_url" && (
                                <span className="text-xs text-muted-foreground mt-1">QR Code</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            ref={(el) => { fileInputRefs.current[field.key] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileSelect(field.key, e)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[field.key]?.click()}
                            disabled={uploading[field.key]}
                            className="gap-2"
                          >
                            {uploading[field.key] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            {uploading[field.key] ? "Uploading..." : `Upload ${field.label}`}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG or SVG. Max 2MB.
                          </p>
                        </div>
                      </div>
                    )}

                    {field.type === "bank_accounts" && (
                      <BankAccountsEditor
                        value={formData[field.key] || "[]"}
                        onChange={(value) => handleInputChange(field.key, value)}
                      />
                    )}

                    {field.label_bn && (
                      <p className="text-xs text-muted-foreground">{field.label_bn}</p>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {/* Gateway instructions */}
          {method.type === "gateway" && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                {method.method_id === "sslcommerz" && (
                  <>
                    <strong>How to get credentials:</strong><br />
                    1. Login to SSLCommerz merchant panel<br />
                    2. Go to API Credentials section<br />
                    3. Copy Store ID and Store Password
                  </>
                )}
                {method.method_id === "aamarpay" && (
                  <>
                    <strong>How to get credentials:</strong><br />
                    1. Login to aamarPay merchant dashboard<br />
                    2. Go to Settings → API Keys<br />
                    3. Copy your Store ID and Signature Key
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
