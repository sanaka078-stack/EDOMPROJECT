import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileDown,
  FileUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Product } from "./ProductCard";

interface ProductImportExportProps {
  products: Product[];
  onImport: (products: Omit<Product, "id">[]) => void;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export function ProductImportExport({ products, onImport }: ProductImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<Omit<Product, "id">[]>([]);

  // Export products to CSV
  const exportToCSV = (selectedOnly: boolean = false, productsToExport?: Product[]) => {
    const dataToExport = productsToExport || products;
    
    const headers = [
      "name",
      "sku",
      "price",
      "compare_price",
      "stock",
      "category",
      "status",
      "image",
      "sizes",
      "colors",
    ];

    const csvRows = [
      headers.join(","),
      ...dataToExport.map((p) =>
        [
          `"${p.name.replace(/"/g, '""')}"`,
          p.sku,
          p.price,
          p.comparePrice || "",
          p.stock,
          `"${p.category}"`,
          p.status,
          p.image,
          `"${(p.sizes || []).join(";")}"`,
          `"${(p.colors || []).join(";")}"`,
        ].join(",")
      ),
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${dataToExport.length} products to CSV`);
  };

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      "name",
      "sku",
      "price",
      "compare_price",
      "stock",
      "category",
      "status",
      "image",
      "sizes",
      "colors",
    ];

    const exampleRow = [
      '"Sample Product Name"',
      "SKU-001",
      "1299",
      "1599",
      "50",
      '"T-Shirts"',
      "active",
      "https://example.com/image.jpg",
      '"S;M;L;XL"',
      '"#000000;#FFFFFF"',
    ];

    const csvContent = [headers.join(","), exampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "product_import_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded");
  };

  // Parse CSV file
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = "";
      } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !insideQuotes) {
        currentRow.push(currentCell.trim());
        if (currentRow.some((cell) => cell !== "")) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = "";
        if (char === "\r") i++;
      } else {
        currentCell += char;
      }
    }

    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell !== "")) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);

      if (rows.length < 2) {
        toast.error("CSV file is empty or invalid");
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
      const dataRows = rows.slice(1);

      const parsedProducts: Omit<Product, "id">[] = [];
      const errors: { row: number; message: string }[] = [];

      dataRows.forEach((row, index) => {
        try {
          const getValue = (header: string) => {
            const idx = headers.indexOf(header);
            return idx >= 0 ? row[idx] : "";
          };

          const name = getValue("name");
          const sku = getValue("sku");
          const price = parseFloat(getValue("price")) || 0;

          if (!name || !sku) {
            errors.push({ row: index + 2, message: "Missing required fields (name, sku)" });
            return;
          }

          const product: Omit<Product, "id"> = {
            name,
            sku,
            price,
            comparePrice: parseFloat(getValue("compare_price")) || undefined,
            stock: parseInt(getValue("stock")) || 0,
            category: getValue("category") || "Uncategorized",
            status: (getValue("status") as Product["status"]) || "draft",
            image: getValue("image") || "/placeholder.svg",
            sizes: getValue("sizes")
              ? getValue("sizes").split(";").filter(Boolean)
              : [],
            colors: getValue("colors")
              ? getValue("colors").split(";").filter(Boolean)
              : [],
          };

          parsedProducts.push(product);
        } catch (err) {
          errors.push({ row: index + 2, message: "Failed to parse row" });
        }
      });

      setPreviewData(parsedProducts);
      setImportResult({ success: parsedProducts.length, failed: errors.length, errors });
      setImportDialogOpen(true);
    };

    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Confirm import
  const confirmImport = async () => {
    setImporting(true);
    setImportProgress(0);

    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setImportProgress(i);
    }

    onImport(previewData);
    setImporting(false);
    setImportDialogOpen(false);
    toast.success(`Successfully imported ${previewData.length} products`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import/Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-popover">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={downloadTemplate}>
            <FileDown className="mr-2 h-4 w-4" />
            Download Template
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => exportToCSV(false)}>
            <Download className="mr-2 h-4 w-4" />
            Export All ({products.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5 text-accent" />
              Import Products
            </DialogTitle>
            <DialogDescription>
              Review the import summary before confirming
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 rounded-lg bg-success/10 p-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{importResult.success}</p>
                    <p className="text-sm text-muted-foreground">Valid products</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{importResult.failed}</p>
                    <p className="text-sm text-muted-foreground">Failed rows</p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Errors found:
                  </p>
                  <ScrollArea className="h-32 rounded-lg border border-border bg-muted/50 p-3">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        <Badge variant="outline" className="mr-2">
                          Row {error.row}
                        </Badge>
                        {error.message}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Preview (first 5 products):</p>
                  <ScrollArea className="h-40 rounded-lg border border-border">
                    <div className="space-y-2 p-3">
                      {previewData.slice(0, 5).map((product, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg bg-card p-2"
                        >
                          <div className="h-10 w-10 rounded bg-muted" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku} • ৳{product.price}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {product.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Progress */}
              {importing && (
                <div className="space-y-2">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    Importing... {importProgress}%
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importing || previewData.length === 0}
              className="gap-2"
            >
              {importing ? (
                "Importing..."
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import {previewData.length} Products
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
