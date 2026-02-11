import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Plus, X } from "lucide-react";

// Predefined tag colors for visual variety
const tagColors = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
];

// Suggested tags for quick selection
const suggestedTags = [
  "VIP কাস্টমার",
  "প্রথম অর্ডার",
  "রিটার্ন রিকোয়েস্ট",
  "পেমেন্ট ইস্যু",
  "ডেলিভারি ইস্যু",
  "প্রোডাক্ট প্রশ্ন",
  "রিফান্ড",
  "উচ্চ মূল্য",
  "ফলো-আপ",
  "সমাধান হয়েছে",
];

interface ConversationTagsEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

function getTagColor(tag: string): string {
  // Generate consistent color based on tag string
  const hash = tag.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return tagColors[hash % tagColors.length];
}

export function ConversationTagsEditor({ tags = [], onTagsChange, disabled }: ConversationTagsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTag, setNewTag] = useState("");

  const handleAddTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((t) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      handleAddTag(newTag);
    }
  };

  const availableSuggestions = suggestedTags.filter((t) => !tags.includes(t));

  return (
    <div className="space-y-2">
      {/* Display current tags */}
      <div className="flex flex-wrap gap-1">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className={`${getTagColor(tag)} gap-1`}>
            {tag}
            {!disabled && (
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 rounded-full hover:bg-black/10 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}

        {/* Add tag button */}
        {!disabled && (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1">
                <Plus className="h-3 w-3" />
                ট্যাগ
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
              <div className="space-y-3">
                {/* Input for new tag */}
                <div className="flex gap-2">
                  <Input
                    placeholder="নতুন ট্যাগ..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-8"
                    onClick={() => handleAddTag(newTag)}
                    disabled={!newTag.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Suggested tags */}
                {availableSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">প্রস্তাবিত ট্যাগ:</p>
                    <div className="flex flex-wrap gap-1">
                      {availableSuggestions.slice(0, 6).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-muted text-xs"
                          onClick={() => handleAddTag(tag)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Empty state */}
      {tags.length === 0 && disabled && (
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <Tag className="h-3 w-3" />
          <span>কোনো ট্যাগ নেই</span>
        </div>
      )}
    </div>
  );
}
