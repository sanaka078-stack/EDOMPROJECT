import { Plus, Upload, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface QuickActionsProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export function QuickActions({ onRefresh, loading }: QuickActionsProps) {
  const navigate = useNavigate();

  const handleAddProduct = () => {
    navigate('/admin/products?action=add');
  };

  const handleImport = () => {
    navigate('/admin/products?action=import');
  };

  const handleExport = () => {
    navigate('/admin/products?action=export');
  };

  const handleSync = () => {
    if (onRefresh) {
      onRefresh();
      toast.success("Dashboard data synced successfully!");
    }
  };

  const actions = [
    { label: "Add Product", icon: Plus, variant: "default" as const, onClick: handleAddProduct },
    { label: "Import", icon: Upload, variant: "outline" as const, onClick: handleImport },
    { label: "Export", icon: Download, variant: "outline" as const, onClick: handleExport },
    { label: "Sync", icon: RefreshCw, variant: "outline" as const, onClick: handleSync },
  ];

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {actions.map((action, index) => (
        <Button 
          key={action.label} 
          variant={action.variant} 
          size="sm" 
          onClick={action.onClick}
          disabled={action.label === "Sync" && loading}
          className={`gap-1.5 sm:gap-2 text-xs sm:text-sm ${index === 0 ? 'flex-1 sm:flex-none' : 'hidden sm:flex'}`}
        >
          <action.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${action.label === "Sync" && loading ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline sm:inline">{action.label}</span>
          <span className="xs:hidden">{index === 0 ? 'Add' : ''}</span>
        </Button>
      ))}
    </div>
  );
}
