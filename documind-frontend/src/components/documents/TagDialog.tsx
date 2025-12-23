import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Plus, Tag, X, Check, Palette } from "lucide-react";
import { documentsApi, tagsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DocumentTag } from "@/types/api";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  onUpdate: () => void;
  tags: DocumentTag[];
}

// Predefined color palette for tags
const TAG_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Amber", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Lime", value: "#84cc16" },
  { name: "Green", value: "#22c55e" },
  { name: "Emerald", value: "#10b981" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Sky", value: "#0ea5e9" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Violet", value: "#8b5cf6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Fuchsia", value: "#d946ef" },
  { name: "Pink", value: "#ec4899" },
  { name: "Rose", value: "#f43f5e" },
  { name: "Gray", value: "#6b7280" },
  { name: "Slate", value: "#64748b" },
  { name: "Zinc", value: "#71717a" },
];

export const TagDialog = ({ open, onOpenChange, documentId, onUpdate, tags }: TagDialogProps) => {
  const [documentTags, setDocumentTags] = useState<Set<string>>(new Set());
  const [originalTags, setOriginalTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6b7280");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (documentId && open) {
      loadDocumentTags();
    }
  }, [documentId, open]);

  const loadDocumentTags = async () => {
    if (!documentId) return;
    try {
      const doc = await documentsApi.get(documentId);
      const tagSet = new Set(doc.tags);
      setDocumentTags(tagSet);
      setOriginalTags(new Set(doc.tags)); // Keep track of original state
    } catch (error) {
      console.error("Failed to load document tags:", error);
    }
  };

  const toggleTag = (tagId: string) => {
    // Only update local state, don't apply to backend yet
    const newSet = new Set(documentTags);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    setDocumentTags(newSet);
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsLoading(true);
      const newTag = await tagsApi.create(newTagName.trim(), newTagColor);
      // Add the new tag to the pending selection
      const newSet = new Set(documentTags);
      newSet.add(newTag.id);
      setDocumentTags(newSet);
      setNewTagName("");
      setNewTagColor("#6b7280"); // Reset to default gray
      setColorPickerOpen(false);
      toast({
        title: "Success",
        description: "Tag created. Click Apply to add it to the document.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create tag",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!documentId) return;

    try {
      setIsApplying(true);
      // Apply all tag changes at once
      await documentsApi.update(documentId, { tags: Array.from(documentTags) });
      setOriginalTags(new Set(documentTags)); // Update original state
      onUpdate();
      toast({
        title: "Success",
        description: "Tags updated successfully",
      });
      onOpenChange(false); // Close dialog after successful apply
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancel = () => {
    // Reset to original state
    setDocumentTags(new Set(originalTags));
    onOpenChange(false);
  };

  const hasChanges = () => {
    if (documentTags.size !== originalTags.size) return true;
    for (const tagId of documentTags) {
      if (!originalTags.has(tagId)) return true;
    }
    for (const tagId of originalTags) {
      if (!documentTags.has(tagId)) return true;
    }
    return false;
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isApplying) {
      // Reset to original state when closing without applying
      setDocumentTags(new Set(originalTags));
      setNewTagName("");
      setNewTagColor("#6b7280");
      setColorPickerOpen(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Manage tags
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Create New Tag Section */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Plus className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Create new tag</Label>
            </div>
            
            <div className="space-y-1.5 pl-4.5">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Enter tag name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTagName.trim()) {
                        handleCreateTag();
                      }
                    }}
                    disabled={isLoading}
                    className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626] pr-7"
                  />
                  {newTagName && (
                    <div
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border border-white dark:border-[#171717]"
                      style={{ backgroundColor: newTagColor }}
                    />
                  )}
                </div>
                
                <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0 border border-[#e5e5e5] dark:border-[#262626]"
                    >
                      <div
                        className="w-full h-full rounded-sm"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2.5 border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]" align="start">
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5">
                        <Palette className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Choose color</Label>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => {
                              setNewTagColor(color.value);
                              setColorPickerOpen(false);
                            }}
                            className={cn(
                              "aspect-square rounded border transition-all hover:scale-110",
                              newTagColor === color.value
                                ? "border-[#171717] dark:border-[#fafafa] ring-1 ring-offset-1 ring-[#171717]/20 dark:ring-[#fafafa]/20"
                                : "border-[#e5e5e5] dark:border-[#262626]"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {newTagColor === color.value && (
                              <Check className="h-2 w-2 text-white m-auto drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                      
                      <Separator className="my-2" />
                      
                      <div className="space-y-1">
                        <Label className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">Custom color</Label>
                        <div className="flex gap-1.5">
                          <Input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="h-6 w-full cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={newTagColor}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                                setNewTagColor(value);
                              }
                            }}
                            placeholder="#000000"
                            className="h-6 w-20 font-mono text-[10px] border-[#e5e5e5] dark:border-[#262626]"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  onClick={handleCreateTag}
                  disabled={isLoading || !newTagName.trim()}
                  className="h-8 w-8 p-0 bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
                >
                  {isLoading ? (
                    <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Existing Tags Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Available tags
                </Label>
                <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] bg-[#fafafa] dark:bg-[#0a0a0a] px-1 py-0.5 rounded">
                  {tags.length}
                </span>
              </div>
              {hasChanges() && (
                <span className="text-xs text-[#171717] dark:text-[#fafafa] font-medium">
                  {documentTags.size} selected
                </span>
              )}
            </div>
            
            <div className="space-y-0.5 max-h-[240px] overflow-y-auto rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] p-1.5 pl-4">
              {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="p-1.5 rounded-full bg-[#e5e5e5] dark:bg-[#262626] mb-1.5">
                    <Tag className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                  </div>
                  <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">No tags available</p>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Create your first tag above
                  </p>
                </div>
              ) : (
                tags.map((tag) => {
                  const isSelected = documentTags.has(tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={cn(
                        "group flex items-center gap-1.5 px-1.5 py-1 rounded-md transition-all cursor-pointer",
                        "hover:bg-white dark:hover:bg-[#171717] border border-transparent",
                        isSelected && "bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626]"
                      )}
                      onClick={() => !isApplying && toggleTag(tag.id)}
                    >
                      <Checkbox
                        id={tag.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag.id)}
                        disabled={isApplying}
                        className="h-3 w-3 data-[state=checked]:bg-[#171717] dark:data-[state=checked]:bg-[#fafafa] data-[state=checked]:border-[#171717] dark:data-[state=checked]:border-[#fafafa]"
                      />
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0 border border-white dark:border-[#171717]",
                          isSelected && "ring-1 ring-[#171717]/30 dark:ring-[#fafafa]/30"
                        )}
                        style={{ backgroundColor: tag.color || "#6b7280" }}
                      />
                      <label
                        htmlFor={tag.id}
                        className={cn(
                          "flex-1 text-xs cursor-pointer select-none",
                          isSelected ? "text-[#171717] dark:text-[#fafafa] font-medium" : "text-[#737373] dark:text-[#a3a3a3]"
                        )}
                      >
                        {tag.name}
                      </label>
                      {isSelected && (
                        <Check className="h-2.5 w-2.5 text-[#171717] dark:text-[#fafafa] flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isApplying}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !hasChanges()}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isApplying ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              "Apply changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
