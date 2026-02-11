import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { 
  Truck, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PathaoSettings } from "./PathaoSettings";
import { GoogleAnalyticsSettings } from "./GoogleAnalyticsSettings";

export function IntegrationsSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue, refetch } = useStoreSettings();
  
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setApiKey(getSettingValue("STEADFAST_API_KEY"));
      setSecretKey(getSettingValue("STEADFAST_SECRET_KEY"));
    }
  }, [loading, settings]);

  const handleSave = async () => {
    const success = await updateMultipleSettings([
      { key: "STEADFAST_API_KEY", value: apiKey },
      { key: "STEADFAST_SECRET_KEY", value: secretKey },
    ]);
    
    if (success) {
      setConnectionStatus("idle");
    }
  };

  const testConnection = async () => {
    if (!apiKey || !secretKey) {
      toast.error("Please enter both API Key and Secret Key");
      return;
    }

    setTesting(true);
    setConnectionStatus("idle");

    try {
      // First save the credentials
      await updateMultipleSettings([
        { key: "STEADFAST_API_KEY", value: apiKey },
        { key: "STEADFAST_SECRET_KEY", value: secretKey },
      ]);

      // Wait a moment for the edge function to pick up new credentials
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Then test the connection
      const { data, error } = await supabase.functions.invoke("steadfast-courier", {
        body: { action: "get_balance" },
      });

      if (error) throw error;

      if (data?.current_balance !== undefined) {
        setConnectionStatus("success");
        toast.success(`Connection successful! Balance: ৳${data.current_balance}`);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        setConnectionStatus("success");
        toast.success("Connection successful!");
      }
    } catch (error: any) {
      setConnectionStatus("error");
      toast.error(error.message || "Connection failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConfigured = Boolean(apiKey && secretKey);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Steadfast Courier
                  {isConfigured ? (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Not Configured
                    </Badge>
                  )}
                  {connectionStatus === "success" && (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      Connected
                    </Badge>
                  )}
                  {connectionStatus === "error" && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                      Connection Failed
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Courier delivery service integration for Bangladesh
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="steadfast-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="steadfast-api-key"
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Steadfast API Key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="steadfast-secret-key">Secret Key</Label>
              <div className="relative">
                <Input
                  id="steadfast-secret-key"
                  type={showSecretKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="Enter your Steadfast Secret Key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                >
                  {showSecretKey ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Credentials"}
            </Button>
            <Button 
              variant="outline" 
              onClick={testConnection} 
              disabled={testing || !apiKey || !secretKey}
              className="gap-2"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Test Connection
            </Button>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium mb-2">How to get your API credentials:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Log in to your Steadfast Courier portal (portal.packzy.com)</li>
              <li>Go to Settings → API Settings</li>
              <li>Copy your API Key and Secret Key</li>
              <li>Paste them here and click Save</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Pathao Courier Integration */}
      <PathaoSettings />

      {/* Google Analytics 4 Integration */}
      <GoogleAnalyticsSettings />
    </div>
  );
}
