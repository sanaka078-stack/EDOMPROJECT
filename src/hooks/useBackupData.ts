import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BackupRecord {
  id: string;
  backup_type: "manual" | "scheduled";
  file_format: "json" | "csv";
  file_path: string;
  file_size: number | null;
  tables_included: string[];
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message: string | null;
  created_by: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface RestoreResult {
  success: boolean;
  total_restored: number;
  tables_restored: number;
  results: Record<string, { success: boolean; count: number; error?: string }>;
  failed_tables?: string[];
}

export interface SchemaExportResult {
  success: boolean;
  schema: string;
  file_size: number;
  stats: {
    tables: number;
    columns: number;
    constraints: number;
    indexes: number;
    policies: number;
    functions: number;
    triggers: number;
    enums: number;
  };
}

export function useBackupData() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [exportingSchema, setExportingSchema] = useState(false);
  const [exportingFull, setExportingFull] = useState(false);

  const fetchBackups = async () => {
    try {
      const { data, error } = await supabase
        .from("database_backups")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBackups((data || []) as BackupRecord[]);
    } catch (error: unknown) {
      console.error("Error fetching backups:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const createBackup = async (format: "json" | "csv") => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("database-backup", {
        body: {
          format,
          backup_type: "manual",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Backup created successfully! (${formatFileSize(data.file_size)})`);
        await fetchBackups();
        return data;
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create backup";
      console.error("Backup error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (
    file: File,
    mode: "merge" | "replace" = "merge"
  ): Promise<RestoreResult> => {
    setRestoring(true);
    try {
      const content = await file.text();
      const format = file.name.endsWith(".csv") ? "csv" : "json";

      const { data, error } = await supabase.functions.invoke("database-restore", {
        body: {
          backup_data: content,
          format,
          mode,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`রিস্টোর সম্পন্ন! ${data.total_restored} রেকর্ড পুনরুদ্ধার হয়েছে।`);
        return data as RestoreResult;
      } else if (data?.failed_tables?.length > 0) {
        toast.warning(`আংশিক রিস্টোর: ${data.total_restored} রেকর্ড। কিছু টেবিলে সমস্যা হয়েছে।`);
        return data as RestoreResult;
      } else {
        throw new Error(data?.error || "Restore failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to restore backup";
      console.error("Restore error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setRestoring(false);
    }
  };

  const exportSchema = async (): Promise<SchemaExportResult> => {
    setExportingSchema(true);
    try {
      const { data, error } = await supabase.functions.invoke("database-schema-export");

      if (error) throw error;

      if (data?.success) {
        // Download the schema file
        const blob = new Blob([data.schema], { type: "text/sql" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        a.download = `schema_${timestamp}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success(
          `স্কিমা এক্সপোর্ট সম্পন্ন! ${data.stats.tables} টেবিল, ${data.stats.policies} পলিসি।`
        );
        return data as SchemaExportResult;
      } else {
        throw new Error(data?.error || "Schema export failed");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to export schema";
      console.error("Schema export error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setExportingSchema(false);
    }
  };

  const exportFull = async (): Promise<void> => {
    setExportingFull(true);
    try {
      // First get schema
      const { data: schemaData, error: schemaError } = await supabase.functions.invoke(
        "database-schema-export"
      );
      if (schemaError) throw schemaError;
      if (!schemaData?.success) throw new Error(schemaData?.error || "Schema export failed");

      // Then get data backup
      const { data: backupData, error: backupError } = await supabase.functions.invoke(
        "database-backup",
        {
          body: {
            format: "json",
            backup_type: "manual",
          },
        }
      );
      if (backupError) throw backupError;
      if (!backupData?.success) throw new Error(backupData?.error || "Backup failed");

      // Download the backup file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("database-backups")
        .download(backupData.file_name);

      if (downloadError) throw downloadError;

      const dataContent = await fileData.text();

      // Create README
      const readme = `# Database Migration Package
Generated: ${new Date().toISOString()}

## Files Included
- schema.sql - Database structure (tables, constraints, indexes, RLS policies)
- data.json - All table data

## How to Restore in a New Project

### Step 1: Create New Lovable Project
Create a new project at lovable.dev

### Step 2: Run Schema SQL
Go to Cloud View > Run SQL and execute the contents of schema.sql

### Step 3: Upload Data
Go to Settings > Backup > Upload/Restore
Select data.json and choose "Merge" mode

### Step 4: Copy Edge Functions
Edge function code needs to be copied manually from the source project

## Limitations
- Auth users are NOT included (security reasons)
- Storage files (images, documents) are NOT included
- Environment variables/Secrets need to be reconfigured

## Stats
- Tables: ${schemaData.stats.tables}
- RLS Policies: ${schemaData.stats.policies}
- Indexes: ${schemaData.stats.indexes}
- Functions: ${schemaData.stats.functions}
`;

      // Create a ZIP-like structure using multiple downloads
      // Since we can't create actual ZIP in browser easily, download files separately
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      // Download schema
      const schemaBlob = new Blob([schemaData.schema], { type: "text/sql" });
      const schemaUrl = URL.createObjectURL(schemaBlob);
      const schemaLink = document.createElement("a");
      schemaLink.href = schemaUrl;
      schemaLink.download = `full_export_${timestamp}_schema.sql`;
      document.body.appendChild(schemaLink);
      schemaLink.click();
      document.body.removeChild(schemaLink);
      URL.revokeObjectURL(schemaUrl);

      // Download data
      const dataBlob = new Blob([dataContent], { type: "application/json" });
      const dataUrl = URL.createObjectURL(dataBlob);
      const dataLink = document.createElement("a");
      dataLink.href = dataUrl;
      dataLink.download = `full_export_${timestamp}_data.json`;
      document.body.appendChild(dataLink);
      dataLink.click();
      document.body.removeChild(dataLink);
      URL.revokeObjectURL(dataUrl);

      // Download README
      const readmeBlob = new Blob([readme], { type: "text/plain" });
      const readmeUrl = URL.createObjectURL(readmeBlob);
      const readmeLink = document.createElement("a");
      readmeLink.href = readmeUrl;
      readmeLink.download = `full_export_${timestamp}_README.txt`;
      document.body.appendChild(readmeLink);
      readmeLink.click();
      document.body.removeChild(readmeLink);
      URL.revokeObjectURL(readmeUrl);

      await fetchBackups();
      toast.success("সম্পূর্ণ এক্সপোর্ট সম্পন্ন! ৩টি ফাইল ডাউনলোড হয়েছে।");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to export";
      console.error("Full export error:", error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setExportingFull(false);
    }
  };

  const downloadBackup = async (backup: BackupRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("database-backups")
        .download(backup.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = backup.file_path;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Backup downloaded!");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to download backup";
      console.error("Download error:", error);
      toast.error(errorMessage);
    }
  };

  const deleteBackup = async (backup: BackupRecord) => {
    try {
      await supabase.storage.from("database-backups").remove([backup.file_path]);

      const { error } = await supabase
        .from("database_backups")
        .delete()
        .eq("id", backup.id);

      if (error) throw error;

      setBackups((prev) => prev.filter((b) => b.id !== backup.id));
      toast.success("Backup deleted");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete backup";
      console.error("Delete error:", error);
      toast.error(errorMessage);
    }
  };

  return {
    backups,
    loading,
    creating,
    restoring,
    exportingSchema,
    exportingFull,
    createBackup,
    restoreBackup,
    exportSchema,
    exportFull,
    downloadBackup,
    deleteBackup,
    refetch: fetchBackups,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
