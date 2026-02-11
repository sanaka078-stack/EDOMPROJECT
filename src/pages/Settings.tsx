import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  CreditCard,
  Mail,
  Bell,
  Save,
  Globe,
  MapPin,
  Phone,
  Building,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  FileText,
  Send,
  Package,
  ShoppingCart,
  UserCheck,
  RefreshCw,
  Clock,
  Palette,
  Upload,
  Plug,
  Shield,
  Loader2,
  ImageIcon,
  X,
  HardDrive,
} from "lucide-react";
import { IntegrationsSettings } from "@/components/settings/IntegrationsSettings";
import { CannedResponsesSettings } from "@/components/settings/CannedResponsesSettings";
import { PaymentSettings } from "@/components/settings/PaymentSettings";
import { BlockedLoginAttempts } from "@/components/admin/BlockedLoginAttempts";
import { AccountLockouts } from "@/components/admin/AccountLockouts";
import { IPSecuritySettings } from "@/components/settings/IPSecuritySettings";
import { EmailApiConfig } from "@/components/settings/EmailApiConfig";
import { AllEmailNotifications } from "@/components/settings/AllEmailNotifications";
import { AutoReplySettings } from "@/components/settings/AutoReplySettings";
import { BackupSettings } from "@/components/settings/BackupSettings";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { supabase } from "@/integrations/supabase/client";
import { generateSchemaPDF } from "@/utils/generateSchemaPDF";
import { Database } from "lucide-react";

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  currency: string;
  timezone: string;
  logo: string;
  favicon: string;
  description: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
}

import { EmailTemplateEditor } from "@/components/settings/EmailTemplateEditor";
import { CreateTemplateModal } from "@/components/settings/CreateTemplateModal";
import { useEmailTemplates, EmailTemplate } from "@/hooks/useEmailTemplates";

interface NotificationSetting {
  id: string;
  name: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}
const initialNotifications: NotificationSetting[] = [
  { id: "new_order", name: "New Order", description: "Get notified when a new order is placed", email: true, push: true, sms: false },
  { id: "order_cancelled", name: "Order Cancelled", description: "Get notified when an order is cancelled", email: true, push: true, sms: false },
  { id: "low_stock", name: "Low Stock Alert", description: "Get notified when product stock is low", email: true, push: false, sms: false },
  { id: "new_customer", name: "New Customer", description: "Get notified when a new customer registers", email: false, push: true, sms: false },
  { id: "review_received", name: "Review Received", description: "Get notified when a customer leaves a review", email: true, push: true, sms: false },
  { id: "payment_received", name: "Payment Received", description: "Get notified when payment is received", email: true, push: false, sms: true },
  { id: "refund_request", name: "Refund Request", description: "Get notified when a refund is requested", email: true, push: true, sms: true },
];

export default function Settings() {
  const { 
    settings, 
    loading: settingsLoading, 
    saving, 
    updateMultipleSettings, 
    getSettingValue 
  } = useStoreSettings();
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: "",
    storeEmail: "",
    storePhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Bangladesh",
    currency: "BDT",
    timezone: "Asia/Dhaka",
    logo: "",
    favicon: "",
    description: "",
    facebookUrl: "",
    instagramUrl: "",
    twitterUrl: "",
    youtubeUrl: "",
  });
  const [notifications, setNotifications] = useState(initialNotifications);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    templates: emailTemplates, 
    loading: templatesLoading, 
    updateTemplate, 
    toggleTemplate,
    createTemplate,
    deleteTemplate,
  } = useEmailTemplates();
  
  const getTemplatesByCategory = (category: string) => {
    return emailTemplates.filter((t) => t.slug.includes(category));
  };

  // Load settings from database
  useEffect(() => {
    if (!settingsLoading && settings.length > 0) {
      setStoreSettings({
        storeName: getSettingValue("STORE_NAME") || "Ekta Clothing",
        storeEmail: getSettingValue("STORE_EMAIL") || "contact@ektaclothing.com",
        storePhone: getSettingValue("STORE_PHONE") || "+880 1700-000000",
        address: getSettingValue("STORE_ADDRESS") || "123 Fashion Street, Gulshan",
        city: getSettingValue("STORE_CITY") || "Dhaka",
        postalCode: getSettingValue("STORE_POSTAL_CODE") || "1212",
        country: getSettingValue("STORE_COUNTRY") || "Bangladesh",
        currency: getSettingValue("STORE_CURRENCY") || "BDT",
        timezone: getSettingValue("STORE_TIMEZONE") || "Asia/Dhaka",
        logo: getSettingValue("STORE_LOGO") || "",
        favicon: getSettingValue("STORE_FAVICON") || "",
        description: getSettingValue("STORE_DESCRIPTION") || "Premium fashion for the modern Bangladeshi. Quality meets style at affordable prices.",
        facebookUrl: getSettingValue("STORE_FACEBOOK_URL") || "",
        instagramUrl: getSettingValue("STORE_INSTAGRAM_URL") || "",
        twitterUrl: getSettingValue("STORE_TWITTER_URL") || "",
        youtubeUrl: getSettingValue("STORE_YOUTUBE_URL") || "",
      });
    }
  }, [settingsLoading, settings]);

  // Update favicon in document head when it changes
  useEffect(() => {
    if (storeSettings.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = storeSettings.favicon;
    }
  }, [storeSettings.favicon]);

  const updateStoreField = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setStoreSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      // Update local state
      updateStoreField('logo', publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (storeSettings.logo) {
      try {
        // Extract filename from URL
        const urlParts = storeSettings.logo.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Delete from storage
        await supabase.storage.from('store-assets').remove([fileName]);
      } catch (error) {
        console.error('Error removing logo:', error);
      }
    }
    updateStoreField('logo', '');
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 500KB for favicon)
    if (file.size > 500 * 1024) {
      toast.error("Favicon must be less than 500KB");
      return;
    }

    setUploadingFavicon(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `favicon-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('store-assets')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('store-assets')
        .getPublicUrl(fileName);

      // Update local state
      updateStoreField('favicon', publicUrl);
      toast.success("Favicon uploaded successfully!");
    } catch (error: any) {
      console.error('Favicon upload error:', error);
      toast.error(error.message || "Failed to upload favicon");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleRemoveFavicon = async () => {
    if (storeSettings.favicon) {
      try {
        // Extract filename from URL
        const urlParts = storeSettings.favicon.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Delete from storage
        await supabase.storage.from('store-assets').remove([fileName]);
      } catch (error) {
        console.error('Error removing favicon:', error);
      }
    }
    updateStoreField('favicon', '');
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateEditorOpen(true);
  };

  const handleSaveTemplate = async (updatedTemplate: EmailTemplate) => {
    return await updateTemplate(updatedTemplate);
  };

  const handleDeleteTemplate = async (id: string) => {
    return await deleteTemplate(id);
  };

  const updateNotification = (id: string, channel: 'email' | 'push' | 'sms') => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, [channel]: !n[channel] } : n
    ));
  };

  const handleSave = async () => {
    const success = await updateMultipleSettings([
      { key: "STORE_NAME", value: storeSettings.storeName },
      { key: "STORE_EMAIL", value: storeSettings.storeEmail },
      { key: "STORE_PHONE", value: storeSettings.storePhone },
      { key: "STORE_ADDRESS", value: storeSettings.address },
      { key: "STORE_CITY", value: storeSettings.city },
      { key: "STORE_POSTAL_CODE", value: storeSettings.postalCode },
      { key: "STORE_COUNTRY", value: storeSettings.country },
      { key: "STORE_CURRENCY", value: storeSettings.currency },
      { key: "STORE_TIMEZONE", value: storeSettings.timezone },
      { key: "STORE_LOGO", value: storeSettings.logo },
      { key: "STORE_FAVICON", value: storeSettings.favicon },
      { key: "STORE_DESCRIPTION", value: storeSettings.description },
      { key: "STORE_FACEBOOK_URL", value: storeSettings.facebookUrl },
      { key: "STORE_INSTAGRAM_URL", value: storeSettings.instagramUrl },
      { key: "STORE_TWITTER_URL", value: storeSettings.twitterUrl },
      { key: "STORE_YOUTUBE_URL", value: storeSettings.youtubeUrl },
    ]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Manage your store configuration and preferences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                generateSchemaPDF();
                toast.success("Database schema PDF downloaded!");
              }} 
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">DB Schema</span>
            </Button>
            <Button onClick={handleSave} disabled={saving || settingsLoading} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="store" className="gap-2">
              <Store className="h-4 w-4 hidden sm:block" />
              Store
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4 hidden sm:block" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4 hidden sm:block" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4 hidden sm:block" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4 hidden sm:block" />
              Security
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2">
              <HardDrive className="h-4 w-4 hidden sm:block" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Plug className="h-4 w-4 hidden sm:block" />
              Integrations
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-accent" />
                  Store Information
                </CardTitle>
                <CardDescription>Basic information about your store</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      value={storeSettings.storeName}
                      onChange={(e) => updateStoreField("storeName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => updateStoreField("storeEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone Number</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.storePhone}
                      onChange={(e) => updateStoreField("storePhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={storeSettings.address}
                      onChange={(e) => updateStoreField("address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={storeSettings.city}
                      onChange={(e) => updateStoreField("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      value={storeSettings.postalCode}
                      onChange={(e) => updateStoreField("postalCode", e.target.value)}
                    />
                  </div>
                </div>

                {/* Logo Upload Section */}
                <Separator />
                <div className="space-y-4">
                  <Label>Store Logo</Label>
                  <div className="flex items-start gap-6">
                    {/* Logo Preview */}
                    <div className="relative">
                      {storeSettings.logo ? (
                        <div className="relative group">
                          <div className="h-24 w-24 rounded-lg border-2 border-border overflow-hidden bg-muted">
                            <img 
                              src={storeSettings.logo} 
                              alt="Store Logo" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col gap-2">
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => logoInputRef.current?.click()}
                          disabled={uploadingLogo}
                          className="w-fit gap-2"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: Square image, at least 200x200px. Max 2MB. PNG or JPG.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favicon Upload Section */}
                <Separator />
                <div className="space-y-4">
                  <Label>Browser Favicon</Label>
                  <div className="flex items-start gap-6">
                    {/* Favicon Preview */}
                    <div className="relative">
                      {storeSettings.favicon ? (
                        <div className="relative group">
                          <div className="h-16 w-16 rounded-lg border-2 border-border overflow-hidden bg-muted">
                            <img 
                              src={storeSettings.favicon} 
                              alt="Favicon" 
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFavicon}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-col gap-2">
                        <input
                          ref={faviconInputRef}
                          type="file"
                          accept="image/png,image/x-icon,image/ico,.ico"
                          onChange={handleFaviconUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => faviconInputRef.current?.click()}
                          disabled={uploadingFavicon}
                          className="w-fit gap-2"
                        >
                          {uploadingFavicon ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recommended: 32x32px or 64x64px. ICO or PNG format. Max 500KB.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent" />
                  Regional Settings
                </CardTitle>
                <CardDescription>Currency, timezone, and localization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={storeSettings.country} onValueChange={(v) => updateStoreField("country", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                        <SelectItem value="India">🇮🇳 India</SelectItem>
                        <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                        <SelectItem value="USA">🇺🇸 USA</SelectItem>
                        <SelectItem value="UK">🇬🇧 UK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={storeSettings.currency} onValueChange={(v) => updateStoreField("currency", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="BDT">৳ BDT - Bangladeshi Taka</SelectItem>
                        <SelectItem value="INR">₹ INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">$ USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">€ EUR - Euro</SelectItem>
                        <SelectItem value="GBP">£ GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={storeSettings.timezone} onValueChange={(v) => updateStoreField("timezone", v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="Asia/Dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Description & Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-accent" />
                  Branding & Social Media
                </CardTitle>
                <CardDescription>Store description and social media links for footer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="description">Store Description</Label>
                  <Textarea
                    id="description"
                    value={storeSettings.description}
                    onChange={(e) => updateStoreField("description", e.target.value)}
                    placeholder="Brief description about your store..."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears in the footer and meta descriptions.
                  </p>
                </div>
                <Separator />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook URL</Label>
                    <Input
                      id="facebookUrl"
                      type="url"
                      value={storeSettings.facebookUrl}
                      onChange={(e) => updateStoreField("facebookUrl", e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram URL</Label>
                    <Input
                      id="instagramUrl"
                      type="url"
                      value={storeSettings.instagramUrl}
                      onChange={(e) => updateStoreField("instagramUrl", e.target.value)}
                      placeholder="https://instagram.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl">Twitter / X URL</Label>
                    <Input
                      id="twitterUrl"
                      type="url"
                      value={storeSettings.twitterUrl}
                      onChange={(e) => updateStoreField("twitterUrl", e.target.value)}
                      placeholder="https://twitter.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube URL</Label>
                    <Input
                      id="youtubeUrl"
                      type="url"
                      value={storeSettings.youtubeUrl}
                      onChange={(e) => updateStoreField("youtubeUrl", e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentSettings />
          </TabsContent>

          {/* Email Templates */}
          <TabsContent value="emails" className="space-y-6">
            {/* Add Custom Template Button */}
            <div className="flex justify-end">
              <Button onClick={() => setCreateTemplateOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                Create Custom Template
              </Button>
            </div>

            {templatesLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading email templates...
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Order Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5 text-accent" />
                      Order Templates
                    </CardTitle>
                    <CardDescription>Email templates for order lifecycle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getTemplatesByCategory("order").map((template) => {
                        const icons: Record<string, React.ElementType> = {
                          order_confirmation: ShoppingCart,
                          shipping_notification: Package,
                          delivery_confirmation: CheckCircle2,
                        };
                        const Icon = icons[template.slug] || Mail;
                        
                        return (
                          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Modified: {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Switch
                              checked={template.is_active}
                                onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Auth Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-accent" />
                      Authentication Templates
                    </CardTitle>
                    <CardDescription>Email templates for user authentication</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getTemplatesByCategory("auth").map((template) => {
                        const icons: Record<string, React.ElementType> = {
                          password_reset: RefreshCw,
                          welcome_email: UserCheck,
                        };
                        const Icon = icons[template.slug] || Mail;
                        
                        return (
                          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Modified: {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Switch
                              checked={template.is_active}
                                onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Marketing Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-accent" />
                      Marketing Templates
                    </CardTitle>
                    <CardDescription>Email templates for customer engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getTemplatesByCategory("marketing").map((template) => {
                        const icons: Record<string, React.ElementType> = {
                          abandoned_cart: Clock,
                          review_request: Send,
                        };
                        const Icon = icons[template.slug] || Mail;
                        
                        return (
                          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Modified: {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Switch
                              checked={template.is_active}
                                onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Security Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-accent" />
                      Security Templates
                    </CardTitle>
                    <CardDescription>Email templates for security alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getTemplatesByCategory("security").map((template) => {
                        const icons: Record<string, React.ElementType> = {
                          lockout_alert: AlertCircle,
                          unlock_alert: CheckCircle2,
                          login_alert: Shield,
                        };
                        const Icon = icons[template.slug] || Mail;
                        
                        return (
                          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Icon className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Modified: {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Switch
                              checked={template.is_active}
                                onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Templates */}
                {getTemplatesByCategory("custom").length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-accent" />
                        Custom Templates
                      </CardTitle>
                      <CardDescription>Your custom email templates</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {getTemplatesByCategory("custom").map((template) => (
                          <div key={template.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{template.name}</p>
                                <p className="text-sm text-muted-foreground line-clamp-1">{template.subject}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-muted-foreground hidden sm:block">
                                Modified: {new Date(template.updated_at).toLocaleDateString()}
                              </span>
                              <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template)}>
                                Edit
                              </Button>
                              <Switch
                                checked={template.is_active}
                                onCheckedChange={(checked) => toggleTemplate(template.id, checked)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Email Template Editor Modal */}
            <EmailTemplateEditor
              template={editingTemplate}
              open={templateEditorOpen}
              onOpenChange={setTemplateEditorOpen}
              onSave={handleSaveTemplate}
              onDelete={handleDeleteTemplate}
            />

            {/* Create Template Modal */}
            <CreateTemplateModal
              open={createTemplateOpen}
              onOpenChange={setCreateTemplateOpen}
              onSave={createTemplate}
            />
          </TabsContent>

          {/* Notification & Alert Settings */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Email API Configuration */}
            <EmailApiConfig />

            {/* All Email Notifications */}
            <AllEmailNotifications />
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <IPSecuritySettings />
            <AccountLockouts />
            <BlockedLoginAttempts />
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-6">
            <BackupSettings />
          </TabsContent>

          {/* Integrations Settings */}
          <TabsContent value="integrations" className="space-y-6">
            <IntegrationsSettings />
            
            {/* Live Chat Auto-Reply Settings */}
            <AutoReplySettings />
            
            {/* Canned Responses / Quick Replies */}
            <CannedResponsesSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
