import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Save,
  Eye,
  Code,
  Plus,
  X,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import type { EmailTemplate } from "@/hooks/useEmailTemplates";

interface CreateTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">) => Promise<EmailTemplate | null>;
}

const defaultTemplateBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Template</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Title Here</h1>
      </div>
      <div style="padding: 32px;">
        <p>Hi {{customer_name}},</p>
        <p>Your content here...</p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="{{action_url}}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px;">Call to Action</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

export function CreateTemplateModal({
  open,
  onOpenChange,
  onSave,
}: CreateTemplateModalProps) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(defaultTemplateBody);
  const [category, setCategory] = useState<"order" | "auth" | "marketing" | "security" | "custom">("custom");
  const [variables, setVariables] = useState<string[]>(["customer_name", "action_url"]);
  const [newVariable, setNewVariable] = useState("");
  const [activeTab, setActiveTab] = useState("editor");
  const [saving, setSaving] = useState(false);

  const handleAddVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const handleRemoveVariable = (variable: string) => {
    setVariables(variables.filter((v) => v !== variable));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }
    if (!subject.trim()) {
      toast.error("Subject line is required");
      return;
    }
    if (!body.trim()) {
      toast.error("Email body is required");
      return;
    }

    setSaving(true);
    const result = await onSave({
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '_'),
      subject: subject.trim(),
      body_html: body,
      body_text: null,
      variables: variables,
      is_active: true,
    });

    setSaving(false);

    if (result) {
      // Reset form
      setName("");
      setSubject("");
      setBody(defaultTemplateBody);
      setCategory("custom");
      setVariables(["customer_name", "action_url"]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Custom Email Template
          </DialogTitle>
          <DialogDescription>
            Create a new email template for your store
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Special Promotion"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Special offer just for you!"
            />
          </div>

          <div className="space-y-2">
            <Label>Variables</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {variables.map((variable) => (
                <Badge
                  key={variable}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {`{{${variable}}}`}
                  <button
                    onClick={() => handleRemoveVariable(variable)}
                    className="hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value.replace(/[^a-z0-9_]/gi, "_"))}
                placeholder="Add variable (e.g., discount_code)"
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleAddVariable()}
              />
              <Button variant="outline" size="sm" onClick={handleAddVariable}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editor" className="gap-2">
              <Code className="h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[250px] rounded-md border">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter HTML email content..."
                className="min-h-[250px] font-mono text-sm border-0 focus-visible:ring-0"
              />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 overflow-hidden mt-4">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Subject: {subject || "(No subject)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[250px]">
                  <iframe
                    srcDoc={body}
                    title="Email Preview"
                    className="w-full h-[250px] border-0"
                    sandbox="allow-same-origin"
                  />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? "Creating..." : "Create Template"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
