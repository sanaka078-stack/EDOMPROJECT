import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Eye,
  Code,
  Variable,
  Mail,
  ShoppingCart,
  Package,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Clock,
  Send,
  Copy,
  AlertTriangle,
  Shield,
  Unlock,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { EmailTemplate } from "@/hooks/useEmailTemplates";

interface EmailTemplateEditorProps {
  template: EmailTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: EmailTemplate) => Promise<boolean>;
  onDelete?: (id: string) => Promise<boolean>;
}

const defaultTemplates: Record<string, { body: string; variables: string[] }> = {
  order_confirmation: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed! 🎉</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Thank you for your order! Your order <strong>#{{order_number}}</strong> has been confirmed.</p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 16px 0;">Order Details</h3>
          {{order_items}}
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <span>Total:</span>
          <strong>{{order_total}}</strong>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{tracking_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Track Order</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "order_number", "order_items", "order_total", "tracking_url"],
  },
  shipping_notification: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Shipped</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Order is on the Way! 🚚</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Great news! Your order <strong>#{{order_number}}</strong> has been shipped.</p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p><strong>Courier:</strong> {{courier_name}}</p>
          <p><strong>Tracking Number:</strong> {{tracking_number}}</p>
          <p><strong>Estimated Delivery:</strong> {{estimated_delivery}}</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{tracking_url}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Track Package</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "order_number", "courier_name", "tracking_number", "estimated_delivery", "tracking_url"],
  },
  delivery_confirmation: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Delivered</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Order Delivered! ✅</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Your order <strong>#{{order_number}}</strong> has been delivered successfully!</p>
        
        <p>We hope you love your purchase. If you have any questions, feel free to reach out to us.</p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{review_url}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Leave a Review</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "order_number", "review_url"],
  },
  password_reset: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password 🔐</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{reset_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Reset Password</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "reset_url"],
  },
  welcome_email: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #ec4899, #db2777); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to {{store_name}}! 🎉</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Thank you for creating an account with us. We're excited to have you as part of our community!</p>
        
        <p>Here's what you can do:</p>
        <ul>
          <li>Browse our latest collections</li>
          <li>Track your orders easily</li>
          <li>Save items to your wishlist</li>
          <li>Get exclusive member discounts</li>
        </ul>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{shop_url}}" style="display: inline-block; background: linear-gradient(135deg, #ec4899, #db2777); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Start Shopping</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "store_name", "shop_url"],
  },
  abandoned_cart: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Cart is Waiting</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">🛒</div>
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Cart Misses You!</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>We noticed you left some amazing items in your cart. {{urgency_text}}</p>
        
        {{discount_section}}
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          {{cart_items}}
        </div>
        
        <div style="display: flex; justify-content: space-between; padding: 16px; background-color: #f3f4f6; border-radius: 8px;">
          <span>Cart Total:</span>
          <strong style="color: #8b5cf6;">{{cart_total}}</strong>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{cart_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600;">Complete My Order</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "urgency_text", "discount_section", "cart_items", "cart_total", "cart_url"],
  },
  review_request: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>How was your purchase?</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">How was your purchase? ⭐</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>We hope you're loving your recent purchase from order <strong>#{{order_number}}</strong>!</p>
        
        <p>Your feedback helps us improve and helps other customers make informed decisions. Would you mind taking a moment to leave a review?</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="{{review_url}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Leave a Review</a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">Thank you for being a valued customer!</p>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "order_number", "review_url"],
  },
  lockout_alert: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Locked</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔒 Account Locked</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi Admin,</p>
        <p>An account has been locked due to multiple failed login attempts.</p>
        
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p><strong>Email:</strong> {{email}}</p>
          <p><strong>Failed Attempts:</strong> {{failed_attempts}}</p>
          <p><strong>Locked At:</strong> {{locked_at}}</p>
          <p><strong>IP Address:</strong> {{ip_address}}</p>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{admin_url}}" style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">View in Admin Panel</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["email", "failed_attempts", "locked_at", "ip_address", "admin_url"],
  },
  unlock_alert: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Unlocked</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔓 Account Unlocked</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Good news! Your account has been unlocked and you can now log in again.</p>
        
        <p>If you continue to have trouble logging in, please reset your password or contact our support team.</p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{login_url}}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Login Now</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "login_url"],
  },
  login_alert: {
    body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Login Detected</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🔔 New Login Detected</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>A new login to your account was detected:</p>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p><strong>Device:</strong> {{device_info}}</p>
          <p><strong>IP Address:</strong> {{ip_address}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p><strong>Time:</strong> {{login_time}}</p>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">If this wasn't you, please secure your account immediately by changing your password.</p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{security_url}}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Review Security Settings</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    variables: ["customer_name", "device_info", "ip_address", "location", "login_time", "security_url"],
  },
};

const categoryIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  auth: Shield,
  marketing: Send,
  security: AlertTriangle,
};

const templateIcons: Record<string, React.ElementType> = {
  order_confirmation: ShoppingCart,
  shipping_notification: Package,
  delivery_confirmation: CheckCircle2,
  password_reset: RefreshCw,
  welcome_email: UserCheck,
  abandoned_cart: Clock,
  review_request: Send,
  lockout_alert: AlertTriangle,
  unlock_alert: Unlock,
  login_alert: Shield,
};

export function EmailTemplateEditor({
  template,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: EmailTemplateEditorProps) {
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [saving, setSaving] = useState(false);

  // Load template data when template changes
  useEffect(() => {
    if (template) {
      setEditedSubject(template.subject);
      setEditedBody(template.body_html || defaultTemplates[template.slug]?.body || "");
    }
  }, [template]);

  const handleSave = async () => {
    if (!template) return;
    
    setSaving(true);
    const success = await onSave({
      ...template,
      subject: editedSubject,
      body_html: editedBody,
    });
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    if (!template || !onDelete) return;
    
    const success = await onDelete(template.id);
    if (success) {
      onOpenChange(false);
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    toast.success(`Copied {{${variable}}} to clipboard`);
  };

  const getTemplateVariables = () => {
    if (!template) return [];
    return (template.variables as string[]) || defaultTemplates[template.slug]?.variables || [];
  };

  const Icon = template ? templateIcons[template.slug] || Mail : Mail;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            Edit Template: {template?.name}
          </DialogTitle>
          <DialogDescription>
            Customize the email template content and design
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editor" className="gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-2">
              <Variable className="h-4 w-4" />
              Variables
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 overflow-hidden space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="body">Email Body (HTML)</Label>
              <ScrollArea className="h-[350px] rounded-md border">
                <Textarea
                  id="body"
                  value={editedBody}
                  onChange={(e) => setEditedBody(e.target.value)}
                  placeholder="Enter HTML email content..."
                  className="min-h-[350px] font-mono text-sm border-0 focus-visible:ring-0"
                />
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Subject: {editedSubject}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <iframe
                    srcDoc={editedBody}
                    title="Email Preview"
                    className="w-full h-[400px] border-0"
                    sandbox="allow-same-origin"
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 overflow-hidden mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Variables</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Click on a variable to copy it to your clipboard. Use these in your template with double curly braces.
                </p>
                <div className="flex flex-wrap gap-2">
                  {getTemplateVariables().map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10 transition-colors"
                      onClick={() => copyVariable(variable)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Usage Example</h4>
                  <code className="text-xs bg-muted p-2 rounded block">
                    {`<p>Hi {{customer_name}}, your order #{{order_number}} is confirmed!</p>`}
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t mt-4">
          <div>
            {template && onDelete && (
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Template
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
