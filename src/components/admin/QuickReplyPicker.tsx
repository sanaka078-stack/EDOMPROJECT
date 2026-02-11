import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Zap, Search } from "lucide-react";
import { useCannedResponses, CannedResponse } from "@/hooks/useCannedResponses";

interface QuickReplyPickerProps {
  onSelect: (content: string) => void;
}

export function QuickReplyPicker({ onSelect }: QuickReplyPickerProps) {
  const { responses, isLoading, categories } = useCannedResponses();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.title.toLowerCase().includes(search.toLowerCase()) ||
      response.content.toLowerCase().includes(search.toLowerCase()) ||
      response.shortcut?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || response.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (response: CannedResponse) => {
    onSelect(response.content);
    setOpen(false);
    setSearch("");
    setSelectedCategory(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9"
          title="কুইক রিপ্লাই"
        >
          <Zap className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" side="top" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="কুইক রিপ্লাই খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Badge
                variant={selectedCategory === null ? "default" : "secondary"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedCategory(null)}
              >
                সব
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "secondary"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat || null)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <ScrollArea className="h-64">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              লোড হচ্ছে...
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? "কোনো রেজাল্ট পাওয়া যায়নি" : "কোনো কুইক রিপ্লাই নেই"}
            </div>
          ) : (
            <div className="p-1">
              {filteredResponses.map((response) => (
                <button
                  key={response.id}
                  className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                  onClick={() => handleSelect(response)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{response.title}</span>
                    {response.shortcut && (
                      <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                        {response.shortcut}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {response.content}
                  </p>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
