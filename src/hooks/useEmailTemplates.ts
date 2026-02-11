import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  variables: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      setTemplates((data as EmailTemplate[]) || []);
    } catch (error: any) {
      console.error("Error fetching email templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTemplate = async (template: Partial<EmailTemplate> & { id: string }) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          variables: template.variables,
          is_active: template.is_active,
        } as any)
        .eq("id", template.id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === template.id
            ? { ...t, ...template, updated_at: new Date().toISOString() }
            : t
        )
      );

      toast.success("Email template updated successfully");
      return true;
    } catch (error: any) {
      console.error("Error updating template:", error);
      toast.error(error.message || "Failed to update template");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleTemplate = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .update({ is_active: enabled } as any)
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_active: enabled } : t
        )
      );

      toast.success(`Template ${enabled ? "enabled" : "disabled"}`);
      return true;
    } catch (error: any) {
      console.error("Error toggling template:", error);
      toast.error("Failed to toggle template");
      return false;
    }
  };

  const createTemplate = async (template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">) => {
    try {
      setSaving(true);
      
      const { data, error } = await supabase
        .from("email_templates")
        .insert({
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          variables: template.variables || [],
          is_active: template.is_active ?? true,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newTemplate = data as EmailTemplate;
      setTemplates((prev) => [...prev, newTemplate]);
      toast.success("Email template created successfully");
      return newTemplate;
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast.error(error.message || "Failed to create template");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("Template deleted successfully");
      return true;
    } catch (error: any) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
      return false;
    }
  };

  const getTemplateBySlug = (slug: string) => {
    return templates.find((t) => t.slug === slug);
  };

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    saving,
    updateTemplate,
    toggleTemplate,
    createTemplate,
    deleteTemplate,
    getTemplateBySlug,
    refetch: fetchTemplates,
  };
}
