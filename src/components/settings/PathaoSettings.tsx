import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function PathaoSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue } = useStoreSettings();
  
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storeId, setStoreId] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setClientId(getSettingValue("PATHAO_CLIENT_ID"));
      setClientSecret(getSettingValue("PATHAO_CLIENT_SECRET"));
      setUsername(getSettingValue("PATHAO_USERNAME"));
      setPassword(getSettingValue("PATHAO_PASSWORD"));
      setStoreId(getSettingValue("PATHAO_STORE_ID"));
      setEnvironment((getSettingValue("PATHAO_ENVIRONMENT") || "sandbox") as "sandbox" | "production");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    const success = await updateMultipleSettings([
      { key: "PATHAO_CLIENT_ID", value: clientId },
      { key: "PATHAO_CLIENT_SECRET", value: clientSecret },
      { key: "PATHAO_USERNAME", value: username },
      { key: "PATHAO_PASSWORD", value: password },
      { key: "PATHAO_STORE_ID", value: storeId },
      { key: "PATHAO_ENVIRONMENT", value: environment },
    ]);
    
    if (success) {
      setConnectionStatus("idle");
    }
  };

  const testConnection = async () => {
    if (!clientId || !clientSecret || !username || !password) {
      toast.error("Please fill in all required credentials");
      return;
    }

    setTesting(true);
    setConnectionStatus("idle");

    try {
      // First save the credentials
      await updateMultipleSettings([
        { key: "PATHAO_CLIENT_ID", value: clientId },
        { key: "PATHAO_CLIENT_SECRET", value: clientSecret },
        { key: "PATHAO_USERNAME", value: username },
        { key: "PATHAO_PASSWORD", value: password },
        { key: "PATHAO_ENVIRONMENT", value: environment },
      ]);

      // Wait for the edge function to pick up new credentials
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test the connection
      const { data, error } = await supabase.functions.invoke("pathao-courier", {
        body: { action: "test_connection" },
      });

      console.log("Pathao test response:", data, error);

      if (error) {
        console.error("Pathao invoke error:", error);
        throw new Error(typeof error === 'object' ? JSON.stringify(error) : String(error));
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.code === 200 && data?.data?.data) {
        setConnectionStatus("success");
        setStores(data.data.data);
        toast.success(`Connection successful! Found ${data.data.data.length} store(s)`);
      } else if (data?.code === 200 || data?.message === "success") {
        setConnectionStatus("success");
        const storeData = data?.data?.data || data?.data || [];
        setStores(Array.isArray(storeData) ? storeData : []);
        toast.success("Connection successful!");
      } else {
        // Check for Pathao API error responses
        const errorMsg = data?.message || data?.errors?.[0]?.message || "Unknown error from Pathao API";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("Pathao connection error:", error);
      setConnectionStatus("error");
      const errorMessage = error?.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
      toast.error(`Connection failed: ${errorMessage}`);
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

  const isConfigured = Boolean(clientId && clientSecret && username && password);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
              <Truck className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Pathao Courier
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
                Pathao Courier integration for delivery in Bangladesh
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pathao-client-id">Client ID *</Label>
            <Input
              id="pathao-client-id"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your Pathao Client ID"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pathao-client-secret">Client Secret *</Label>
            <div className="relative">
              <Input
                id="pathao-client-secret"
                type={showClientSecret ? "text" : "password"}
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Pathao Client Secret"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pathao-username">Username/Email *</Label>
            <Input
              id="pathao-username"
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your Pathao login email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pathao-password">Password *</Label>
            <div className="relative">
              <Input
                id="pathao-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Pathao login password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pathao-environment">Environment</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as "sandbox" | "production")}>
              <SelectTrigger id="pathao-environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                <SelectItem value="production">Production (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pathao-store-id">Default Store ID</Label>
            {stores.length > 0 ? (
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger id="pathao-store-id">
                  <SelectValue placeholder="Select a store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.store_id} value={store.store_id.toString()}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="pathao-store-id"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="Test connection to load stores"
              />
            )}
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
            disabled={testing || !clientId || !clientSecret || !username || !password}
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
            <li>Log in to your Pathao Merchant portal</li>
            <li>Go to Settings → API Credentials</li>
            <li>Copy your Client ID and Client Secret</li>
            <li>Use your Pathao login email and password</li>
            <li>For testing, use Sandbox environment first</li>
          </ol>
          <div className="mt-3 p-3 bg-background rounded border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Sandbox Test Credentials:</p>
            <p className="text-xs text-muted-foreground">Base URL: courier-api-sandbox.pathao.com</p>
            <p className="text-xs text-muted-foreground">Client ID: 7N1aMJQbWm</p>
            <p className="text-xs text-muted-foreground">Client Secret: wRcaibZkUdSNz2EI9ZyuXLlNrnAv0TdPUPXMnD39</p>
            <p className="text-xs text-muted-foreground">Username: test@pathao.com</p>
            <p className="text-xs text-muted-foreground">Password: lovePathao</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
