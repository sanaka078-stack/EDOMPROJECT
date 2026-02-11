import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { 
  BarChart3, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export function GoogleAnalyticsSettings() {
  const { settings, loading, saving, updateMultipleSettings, getSettingValue } = useStoreSettings();
  
  const [measurementId, setMeasurementId] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (!loading && settings.length > 0) {
      setMeasurementId(getSettingValue("GA4_MEASUREMENT_ID") || "");
      setIsEnabled(getSettingValue("GA4_ENABLED") === "true");
    }
  }, [loading, settings]);

  const handleSave = async () => {
    // Validate measurement ID format
    if (measurementId && !measurementId.match(/^G-[A-Z0-9]+$/)) {
      toast.error("Invalid Measurement ID format. It should start with 'G-' followed by alphanumeric characters.");
      return;
    }

    const success = await updateMultipleSettings([
      { key: "GA4_MEASUREMENT_ID", value: measurementId },
      { key: "GA4_ENABLED", value: isEnabled.toString() },
    ]);
    
    if (success) {
      // Reload GA4 script if enabled
      if (isEnabled && measurementId) {
        updateGA4Script(measurementId);
        toast.success("Google Analytics settings saved! Tracking is now active.");
      } else {
        removeGA4Script();
        toast.success("Google Analytics settings saved. Tracking is disabled.");
      }
    }
  };

  const updateGA4Script = (id: string) => {
    // Remove existing GA4 scripts
    removeGA4Script();
    
    // Add new script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.id = 'ga4-script';
    document.head.appendChild(script);

    // Initialize gtag
    const inlineScript = document.createElement('script');
    inlineScript.id = 'ga4-inline';
    inlineScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}');
    `;
    document.head.appendChild(inlineScript);
  };

  const removeGA4Script = () => {
    const existingScript = document.getElementById('ga4-script');
    const existingInline = document.getElementById('ga4-inline');
    if (existingScript) existingScript.remove();
    if (existingInline) existingInline.remove();
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

  const isConfigured = Boolean(measurementId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Analytics 4
                {isConfigured && isEnabled ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                ) : isConfigured ? (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Disabled
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Track website traffic and user behavior
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Tracking</Label>
            <p className="text-sm text-muted-foreground">
              Turn on to start tracking visitor data
            </p>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ga4-measurement-id">Measurement ID</Label>
          <Input
            id="ga4-measurement-id"
            value={measurementId}
            onChange={(e) => setMeasurementId(e.target.value.toUpperCase())}
            placeholder="G-XXXXXXXXXX"
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Example: G-CJ5FW979TJ
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>

        <div className="rounded-lg bg-muted/50 p-4 space-y-3">
          <h4 className="font-medium">How to get your Measurement ID:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Analytics <ExternalLink className="h-3 w-3" /></a></li>
            <li>Select your property or create a new one</li>
            <li>Go to Admin → Data Streams → Web</li>
            <li>Copy the Measurement ID (starts with G-)</li>
          </ol>
        </div>

        {isEnabled && measurementId && (
          <div className="rounded-lg border border-success/20 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
              <div>
                <p className="font-medium text-success">Tracking Active</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Page views and events are being sent to Google Analytics. 
                  Check your <a href={`https://analytics.google.com/analytics/web/?authuser=0#/realtime/overview`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Realtime Report <ExternalLink className="h-3 w-3" /></a> to verify.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
