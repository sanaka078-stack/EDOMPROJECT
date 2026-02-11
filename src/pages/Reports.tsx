import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  Calendar as CalendarIcon, 
  Clock, 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  Package,
  DollarSign,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
  FileSpreadsheet,
  Filter,
  Settings,
  Mail,
  RefreshCw
} from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: 'sales' | 'inventory' | 'customers' | 'orders' | 'products' | 'financial';
  format: 'pdf' | 'excel' | 'csv';
  generatedAt: string;
  size: string;
  status: 'ready' | 'generating' | 'failed';
}

interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextRun: string;
  lastRun?: string;
  recipients: string[];
  isActive: boolean;
  format: 'pdf' | 'excel';
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  fields: string[];
  type: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "sales",
    name: "Sales Report",
    description: "Sales performance, revenue, and trend analysis",
    icon: TrendingUp,
    fields: ["Date Range", "Product Category", "Payment Method", "Sales Channel"],
    type: "sales"
  },
  {
    id: "inventory",
    name: "Inventory Report",
    description: "Stock levels, movement, and valuation",
    icon: Package,
    fields: ["Category", "Stock Status", "Supplier", "Warehouse"],
    type: "inventory"
  },
  {
    id: "customers",
    name: "Customer Report",
    description: "Customer activity, retention, and segmentation",
    icon: Users,
    fields: ["Registration Date", "Loyalty Tier", "Location", "Order History"],
    type: "customers"
  },
  {
    id: "orders",
    name: "Order Report",
    description: "Order status, fulfillment, and shipping analytics",
    icon: ShoppingCart,
    fields: ["Order Status", "Shipping Method", "Payment Status", "Date Range"],
    type: "orders"
  },
  {
    id: "products",
    name: "Product Report",
    description: "Product performance, views, and conversion rate",
    icon: BarChart3,
    fields: ["Category", "Price Range", "Stock Status", "Brand"],
    type: "products"
  },
  {
    id: "financial",
    name: "Financial Report",
    description: "Revenue, profit margin, and cost analysis",
    icon: DollarSign,
    fields: ["Fiscal Period", "Revenue Source", "Expense Category", "Tax"],
    type: "financial"
  }
];

const initialReports: Report[] = [
  { id: "rpt-1", name: "January Sales Report", type: "sales", format: "pdf", generatedAt: "2024-01-21 10:30", size: "2.4 MB", status: "ready" },
  { id: "rpt-2", name: "Q4 Inventory Summary", type: "inventory", format: "excel", generatedAt: "2024-01-20 15:45", size: "5.1 MB", status: "ready" },
  { id: "rpt-3", name: "Customer Segmentation", type: "customers", format: "pdf", generatedAt: "2024-01-19 09:00", size: "1.8 MB", status: "ready" },
  { id: "rpt-4", name: "Weekly Order Report", type: "orders", format: "excel", generatedAt: "2024-01-21 08:00", size: "3.2 MB", status: "generating" },
  { id: "rpt-5", name: "Product Performance", type: "products", format: "csv", generatedAt: "2024-01-18 14:20", size: "890 KB", status: "ready" },
];

const initialScheduledReports: ScheduledReport[] = [
  { id: "sch-1", name: "Daily Sales Summary", type: "sales", frequency: "daily", nextRun: "2024-01-22 08:00", lastRun: "2024-01-21 08:00", recipients: ["admin@store.com"], isActive: true, format: "pdf" },
  { id: "sch-2", name: "Weekly Inventory Update", type: "inventory", frequency: "weekly", nextRun: "2024-01-28 09:00", lastRun: "2024-01-21 09:00", recipients: ["manager@store.com", "inventory@store.com"], isActive: true, format: "excel" },
  { id: "sch-3", name: "Monthly Financial Report", type: "financial", frequency: "monthly", nextRun: "2024-02-01 10:00", lastRun: "2024-01-01 10:00", recipients: ["cfo@store.com"], isActive: false, format: "pdf" },
];

const typeConfig: Record<Report['type'], { label: string; color: string; icon: React.ElementType }> = {
  sales: { label: "Sales", color: "bg-green-100 text-green-800", icon: TrendingUp },
  inventory: { label: "Inventory", color: "bg-blue-100 text-blue-800", icon: Package },
  customers: { label: "Customer", color: "bg-purple-100 text-purple-800", icon: Users },
  orders: { label: "Order", color: "bg-orange-100 text-orange-800", icon: ShoppingCart },
  products: { label: "Product", color: "bg-pink-100 text-pink-800", icon: BarChart3 },
  financial: { label: "Financial", color: "bg-yellow-100 text-yellow-800", icon: DollarSign },
};

export default function Reports() {
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(initialScheduledReports);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [newSchedule, setNewSchedule] = useState({
    name: "",
    type: "",
    frequency: "daily" as ScheduledReport['frequency'],
    recipients: "",
    format: "pdf" as 'pdf' | 'excel'
  });

  const stats = {
    totalReports: reports.length,
    scheduledActive: scheduledReports.filter(s => s.isActive).length,
    generatingNow: reports.filter(r => r.status === 'generating').length,
    thisMonth: reports.filter(r => r.generatedAt.startsWith('2024-01')).length
  };

  const filteredReports = reports.filter(report => 
    typeFilter === "all" || report.type === typeFilter
  );

  const handleGenerateReport = () => {
    if (!selectedTemplate) return;

    const newReport: Report = {
      id: `rpt-${Date.now()}`,
      name: `${selectedTemplate.name} - ${format(new Date(), 'dd MMM yyyy')}`,
      type: selectedTemplate.type as Report['type'],
      format: reportFormat,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm'),
      size: "Generating...",
      status: "generating"
    };

    setReports([newReport, ...reports]);
    setBuilderOpen(false);
    setSelectedTemplate(null);
    toast.success("Generating report...");

    // Simulate report generation
    setTimeout(() => {
      setReports(prev => prev.map(r => 
        r.id === newReport.id 
          ? { ...r, status: 'ready' as const, size: `${(Math.random() * 5 + 1).toFixed(1)} MB` }
          : r
      ));
      toast.success("Report generated!");
    }, 3000);
  };

  const handleDownload = (report: Report) => {
    toast.success(`Downloading ${report.name}...`);
  };

  const handleCreateSchedule = () => {
    if (!newSchedule.name || !newSchedule.type || !newSchedule.recipients) {
      toast.error("Please fill in all required fields");
      return;
    }

    const schedule: ScheduledReport = {
      id: `sch-${Date.now()}`,
      name: newSchedule.name,
      type: newSchedule.type,
      frequency: newSchedule.frequency,
      nextRun: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd HH:mm'),
      recipients: newSchedule.recipients.split(',').map(e => e.trim()),
      isActive: true,
      format: newSchedule.format
    };

    setScheduledReports([schedule, ...scheduledReports]);
    setNewSchedule({ name: "", type: "", frequency: "daily", recipients: "", format: "pdf" });
    setScheduleDialogOpen(false);
    toast.success("Scheduled report created");
  };

  const toggleSchedule = (scheduleId: string) => {
    setScheduledReports(scheduledReports.map(s => 
      s.id === scheduleId ? { ...s, isActive: !s.isActive } : s
    ));
    toast.success("Schedule updated");
  };

  const deleteSchedule = (scheduleId: string) => {
    setScheduledReports(scheduledReports.filter(s => s.id !== scheduleId));
    toast.success("Schedule deleted");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
            <p className="text-muted-foreground">Generate and schedule business reports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
              <Clock className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
            <Button onClick={() => setBuilderOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.totalReports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Schedules</p>
                  <p className="text-2xl font-bold">{stats.scheduledActive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Generating</p>
                  <p className="text-2xl font-bold">{stats.generatingNow}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100">
                  <CalendarIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList>
            <TabsTrigger value="reports">Report List</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          {/* Reports List */}
          <TabsContent value="reports" className="space-y-4">
            <div className="flex gap-4 items-center">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="customers">Customer</SelectItem>
                  <SelectItem value="orders">Order</SelectItem>
                  <SelectItem value="products">Product</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => {
                      const type = typeConfig[report.type];
                      const TypeIcon = type.icon;
                      return (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{report.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={type.color} variant="secondary">
                              {type.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="uppercase">
                              {report.format}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.size}</TableCell>
                          <TableCell>{report.generatedAt}</TableCell>
                          <TableCell>
                            {report.status === 'ready' ? (
                              <Badge className="bg-green-100 text-green-800">Ready</Badge>
                            ) : report.status === 'generating' ? (
                              <Badge className="bg-blue-100 text-blue-800">
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Generating
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">Failed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={report.status !== 'ready'}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={report.status !== 'ready'}
                                onClick={() => handleDownload(report)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Reports */}
          <TabsContent value="scheduled" className="space-y-4">
            <div className="grid gap-4">
              {scheduledReports.map((schedule) => (
                <Card key={schedule.id} className={!schedule.isActive ? "opacity-60" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${schedule.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Clock className={`h-4 w-4 ${schedule.isActive ? 'text-green-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{schedule.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="outline">
                              {schedule.frequency === 'daily' ? 'Daily' : 
                               schedule.frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                            </Badge>
                            <Badge variant="outline" className="uppercase">{schedule.format}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Next Run: {schedule.nextRun}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {schedule.recipients.join(", ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={schedule.isActive}
                          onCheckedChange={() => toggleSchedule(schedule.id)}
                        />
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Templates */}
          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => {
                const TemplateIcon = template.icon;
                return (
                  <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => {
                    setSelectedTemplate(template);
                    setBuilderOpen(true);
                  }}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          <TemplateIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                        </div>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {template.fields.map((field) => (
                          <Badge key={field} variant="secondary" className="text-xs">
                            {field}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Report Builder Dialog */}
      <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Builder</DialogTitle>
            <DialogDescription>
              Create a custom report
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label>Report Template</Label>
              <Select 
                value={selectedTemplate?.id || ""} 
                onValueChange={(value) => setSelectedTemplate(reportTemplates.find(t => t.id === value) || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {reportTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Start Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'End Date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Export Format</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={reportFormat === 'pdf'} 
                    onCheckedChange={() => setReportFormat('pdf')}
                  />
                  <FileText className="h-4 w-4" />
                  PDF
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={reportFormat === 'excel'} 
                    onCheckedChange={() => setReportFormat('excel')}
                  />
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox 
                    checked={reportFormat === 'csv'} 
                    onCheckedChange={() => setReportFormat('csv')}
                  />
                  <FileText className="h-4 w-4" />
                  CSV
                </label>
              </div>
            </div>

            {/* Fields to Include */}
            {selectedTemplate && (
              <div className="space-y-2">
                <Label>Fields to Include</Label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTemplate.fields.map((field) => (
                    <label key={field} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox defaultChecked />
                      {field}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBuilderOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} disabled={!selectedTemplate}>
              <Play className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Scheduled Report</DialogTitle>
            <DialogDescription>
              Schedule automatic report generation
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Report Name</Label>
              <Input 
                placeholder="e.g., Daily Sales Summary"
                value={newSchedule.name}
                onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={newSchedule.type} onValueChange={(value) => setNewSchedule({ ...newSchedule, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="inventory">Inventory</SelectItem>
                    <SelectItem value="customers">Customer</SelectItem>
                    <SelectItem value="orders">Order</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={newSchedule.frequency} onValueChange={(value) => setNewSchedule({ ...newSchedule, frequency: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={newSchedule.format} onValueChange={(value) => setNewSchedule({ ...newSchedule, format: value as any })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email Recipients (comma separated)</Label>
              <Input 
                placeholder="email1@example.com, email2@example.com"
                value={newSchedule.recipients}
                onChange={(e) => setNewSchedule({ ...newSchedule, recipients: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSchedule}>Create Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
