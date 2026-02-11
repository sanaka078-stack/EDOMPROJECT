import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Bot, Clock } from "lucide-react";
import { useAutoReplySettings } from "@/hooks/useAutoReplySettings";

export function AutoReplySettings() {
  const { settings, isLoading, updateSettings, isUpdating } = useAutoReplySettings();
  const [localSettings, setLocalSettings] = useState(settings);

  // Sync local state when settings load
  if (!isLoading && localSettings.message !== settings.message && !isUpdating) {
    setLocalSettings(settings);
  }

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const hasChanges =
    localSettings.enabled !== settings.enabled ||
    localSettings.message !== settings.message ||
    localSettings.delaySeconds !== settings.delaySeconds;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          অটো-রিপ্লাই সেটিংস
        </CardTitle>
        <CardDescription>
          যখন কোনো এডমিন অনলাইনে থাকে না, তখন কাস্টমারদের স্বয়ংক্রিয় রিপ্লাই পাঠানো হবে
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto-reply-enabled">অটো-রিপ্লাই সক্রিয়</Label>
            <p className="text-sm text-muted-foreground">
              অফলাইনে থাকলে স্বয়ংক্রিয় রিপ্লাই পাঠান
            </p>
          </div>
          <Switch
            id="auto-reply-enabled"
            checked={localSettings.enabled}
            onCheckedChange={(checked) =>
              setLocalSettings((prev) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auto-reply-message">অটো-রিপ্লাই মেসেজ</Label>
          <Textarea
            id="auto-reply-message"
            value={localSettings.message}
            onChange={(e) =>
              setLocalSettings((prev) => ({ ...prev, message: e.target.value }))
            }
            placeholder="অফলাইনে থাকাকালীন কাস্টমারদের পাঠানো মেসেজ..."
            rows={4}
            disabled={!localSettings.enabled}
          />
          <p className="text-xs text-muted-foreground">
            এই মেসেজটি কাস্টমার চ্যাট শুরু করার পর পাঠানো হবে যদি কোনো এডমিন অনলাইনে না থাকে
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="delay-seconds" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            রিপ্লাই বিলম্ব (সেকেন্ড)
          </Label>
          <Input
            id="delay-seconds"
            type="number"
            min={1}
            max={60}
            value={localSettings.delaySeconds}
            onChange={(e) =>
              setLocalSettings((prev) => ({
                ...prev,
                delaySeconds: parseInt(e.target.value) || 5,
              }))
            }
            className="w-32"
            disabled={!localSettings.enabled}
          />
          <p className="text-xs text-muted-foreground">
            কাস্টমারের প্রথম মেসেজের পর কত সেকেন্ড অপেক্ষা করে অটো-রিপ্লাই পাঠাবে
          </p>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || isUpdating}>
          {isUpdating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              সেভ হচ্ছে...
            </>
          ) : (
            "সেটিংস সেভ করুন"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
