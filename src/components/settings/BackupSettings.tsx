import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Database,
  Download,
  Trash2,
  MoreVertical,
  FileJson,
  FileSpreadsheet,
  Loader2,
  HardDrive,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Upload,
  AlertTriangle,
  FileCode,
  Package,
  Info,
} from "lucide-react";
import { useBackupData, BackupRecord, RestoreResult } from "@/hooks/useBackupData";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function BackupSettings() {
  const { 
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
    refetch 
  } = useBackupData();
  const [deleteConfirm, setDeleteConfirm] = useState<BackupRecord | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState<"merge" | "replace">("merge");
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "-";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusBadge = (status: BackupRecord["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-success gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> In Progress
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json")) {
        alert("Only JSON files are supported.");
        return;
      }
      setSelectedFile(file);
      setRestoreDialogOpen(true);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await restoreBackup(selectedFile, restoreMode);
      setRestoreResult(result);
      setRestoreDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      // Error already handled in hook
    }
  };

  const closeRestoreDialog = () => {
    setRestoreDialogOpen(false);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Migration Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Database Migration Guide</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p><strong>Data Backup (JSON/CSV):</strong> Table data only. Can be restored if the same schema exists.</p>
          <p><strong>Schema Export:</strong> SQL file with table structure, RLS policies, indexes.</p>
          <p><strong>Full Export:</strong> Schema + Data + Guide - for migrating to a new project.</p>
        </AlertDescription>
      </Alert>

      {/* Create Backup Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-accent" />
            Database Backup
          </CardTitle>
          <CardDescription>
            Create, download, and restore complete database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => createBackup("json")}
              disabled={creating || restoring || exportingSchema || exportingFull}
              className="gap-2"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              JSON Backup
            </Button>
            <Button
              onClick={() => createBackup("csv")}
              disabled={creating || restoring || exportingSchema || exportingFull}
              variant="outline"
              className="gap-2"
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              CSV Backup
            </Button>
            
            {/* Upload/Restore Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={creating || restoring || exportingSchema || exportingFull}
              variant="secondary"
              className="gap-2"
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload / Restore
            </Button>
            
            <Button
              onClick={() => refetch()}
              variant="ghost"
              size="icon"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Complete database backup including all tables (Products, Orders, Customers, Settings, etc.)
          </p>
        </CardContent>
      </Card>

      {/* Schema Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-primary" />
            Schema Export
          </CardTitle>
          <CardDescription>
            Export database structure (tables, RLS policies, indexes) as SQL file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => exportSchema()}
              disabled={creating || restoring || exportingSchema || exportingFull}
              variant="outline"
              className="gap-2"
            >
              {exportingSchema ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCode className="h-4 w-4" />
              )}
              Export Schema (SQL)
            </Button>
            
            <Button
              onClick={() => exportFull()}
              disabled={creating || restoring || exportingSchema || exportingFull}
              className="gap-2"
            >
              {exportingFull ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Package className="h-4 w-4" />
              )}
              Full Export (Schema + Data)
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Full export will download 3 files: schema.sql, data.json, and README.txt
          </p>
        </CardContent>
      </Card>

      {/* Restore Result Card */}
      {restoreResult && (
        <Card className="border-success/50 bg-success/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Restore Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold">{restoreResult.total_restored}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{restoreResult.tables_restored}</p>
                <p className="text-sm text-muted-foreground">Tables</p>
              </div>
            </div>
            {restoreResult.failed_tables && restoreResult.failed_tables.length > 0 && (
              <div className="text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Issues: {restoreResult.failed_tables.join(", ")}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRestoreResult(null)}
              className="mt-2"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-accent" />
            Backup History
          </CardTitle>
          <CardDescription>Recent backups</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No backups yet</p>
              <p className="text-sm">Click above to create your first backup</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {backup.file_format === "json" ? (
                            <FileJson className="h-4 w-4 text-primary" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4 text-success" />
                          )}
                          <span className="font-mono text-xs truncate max-w-[150px]">
                            {backup.file_path}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline">
                          {backup.backup_type === "manual" ? "Manual" : "Auto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatFileSize(backup.file_size)}
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(backup.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => downloadBackup(backup)}
                              disabled={backup.status !== "completed"}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm(backup)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This backup file will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm) {
                  deleteBackup(deleteConfirm);
                  setDeleteConfirm(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={closeRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore Backup
            </DialogTitle>
            <DialogDescription>
              Restore database from {selectedFile?.name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-base font-medium mb-3 block">Restore Mode</Label>
            <RadioGroup
              value={restoreMode}
              onValueChange={(v) => setRestoreMode(v as "merge" | "replace")}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="merge" id="merge" className="mt-1" />
                <div>
                  <Label htmlFor="merge" className="font-medium cursor-pointer">
                    Merge (Safe)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Keeps existing data and adds new data. Skips duplicates.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer border-destructive/30">
                <RadioGroupItem value="replace" id="replace" className="mt-1" />
                <div>
                  <Label htmlFor="replace" className="font-medium cursor-pointer text-destructive">
                    Replace (Warning!)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Deletes all existing data and loads new data from backup.
                  </p>
                </div>
              </div>
            </RadioGroup>
            
            {restoreMode === "replace" && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Warning!</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  This option will delete all existing data. This action cannot be undone.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeRestoreDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleRestore}
              disabled={restoring}
              variant={restoreMode === "replace" ? "destructive" : "default"}
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
