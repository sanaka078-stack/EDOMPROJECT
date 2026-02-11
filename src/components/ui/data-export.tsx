import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";

interface DataExportProps<T> {
  data: T[];
  filename: string;
  columns: {
    key: keyof T | ((item: T) => string | number);
    header: string;
  }[];
}

export function DataExport<T>({ data, filename, columns }: DataExportProps<T>) {
  const getValue = (item: T, column: DataExportProps<T>["columns"][0]) => {
    if (typeof column.key === "function") {
      return column.key(item);
    }
    const value = item[column.key];
    if (value === null || value === undefined) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const exportToCSV = () => {
    try {
      const headers = columns.map((col) => col.header);
      const rows = data.map((item) =>
        columns.map((col) => {
          const value = getValue(item, col);
          // Escape quotes and wrap in quotes if contains comma or newline
          if (typeof value === "string" && (value.includes(",") || value.includes("\n") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
      );

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records to CSV`);
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const exportToJSON = () => {
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} records to JSON`);
    } catch (error) {
      toast.error("Failed to export JSON");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToJSON}>
          <FileText className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
