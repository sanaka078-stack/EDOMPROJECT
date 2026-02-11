import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { useCannedResponses, CannedResponse } from "@/hooks/useCannedResponses";

export function CannedResponsesSettings() {
  const { responses, isLoading, categories, addResponse, updateResponse, deleteResponse } = useCannedResponses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    shortcut: "",
    category: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenCreate = () => {
    setSelectedResponse(null);
    setFormData({ title: "", content: "", shortcut: "", category: "" });
    setDialogOpen(true);
  };

  const handleOpenEdit = (response: CannedResponse) => {
    setSelectedResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      shortcut: response.shortcut || "",
      category: response.category || "",
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (response: CannedResponse) => {
    setSelectedResponse(response);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) return;

    setIsSaving(true);
    if (selectedResponse) {
      await updateResponse(selectedResponse.id, formData);
    } else {
      await addResponse(formData);
    }
    setIsSaving(false);
    setDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedResponse) return;
    await deleteResponse(selectedResponse.id);
    setDeleteDialogOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                কুইক রিপ্লাই / ক্যানড রেসপন্স
              </CardTitle>
              <CardDescription>
                দ্রুত উত্তর দেওয়ার জন্য প্রি-সেট মেসেজ তৈরি করুন। শর্টকাট দিয়ে দ্রুত ইনসার্ট করতে পারবেন।
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              নতুন যোগ করুন
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>কোনো কুইক রিপ্লাই নেই</p>
              <Button onClick={handleOpenCreate} variant="outline" className="mt-4">
                প্রথমটি যোগ করুন
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {responses.map((response) => (
                  <div
                    key={response.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{response.title}</h4>
                          {response.shortcut && (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {response.shortcut}
                            </Badge>
                          )}
                          {response.category && (
                            <Badge variant="outline" className="text-xs">
                              {response.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.content}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(response)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(response)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedResponse ? "কুইক রিপ্লাই এডিট করুন" : "নতুন কুইক রিপ্লাই"}
            </DialogTitle>
            <DialogDescription>
              দ্রুত উত্তর দেওয়ার জন্য একটি প্রি-সেট মেসেজ তৈরি করুন
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>শিরোনাম *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="যেমন: স্বাগতম মেসেজ"
              />
            </div>
            <div className="space-y-2">
              <Label>মেসেজ *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="মেসেজ লিখুন..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>শর্টকাট (ঐচ্ছিক)</Label>
                <Input
                  value={formData.shortcut}
                  onChange={(e) => setFormData({ ...formData, shortcut: e.target.value })}
                  placeholder="/hello"
                />
                <p className="text-xs text-muted-foreground">
                  / দিয়ে শুরু করুন
                </p>
              </div>
              <div className="space-y-2">
                <Label>ক্যাটাগরি (ঐচ্ছিক)</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="সাধারণ"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              বাতিল
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title || !formData.content || isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {selectedResponse ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>কুইক রিপ্লাই মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedResponse?.title}" মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
