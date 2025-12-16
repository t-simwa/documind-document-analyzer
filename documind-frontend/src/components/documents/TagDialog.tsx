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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Manage tags
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Create New Tag Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium text-foreground">Create new tag</Label>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex gap-2">
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
                    className="h-10 text-sm pr-9"
                  />
                  {newTagName && (
                    <div
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border border-background/50"
                      style={{ backgroundColor: newTagColor }}
                    />
                  )}
                </div>
                
                <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-10 p-0 border"
                    >
                      <div
                        className="w-full h-full rounded-sm"
                        style={{ backgroundColor: newTagColor }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" align="start">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                        <Label className="text-xs font-medium">Choose color</Label>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1.5">
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
                                ? "border-foreground ring-1 ring-offset-1 ring-foreground/20"
                                : "border-border"
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {newTagColor === color.value && (
                              <Check className="h-2.5 w-2.5 text-white m-auto drop-shadow-md" />
                            )}
                          </button>
                        ))}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Custom color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={newTagColor}
                            onChange={(e) => setNewTagColor(e.target.value)}
                            className="h-7 w-full cursor-pointer"
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
                            className="h-7 w-20 font-mono text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button
                  onClick={handleCreateTag}
                  disabled={isLoading || !newTagName.trim()}
                  className="h-10 px-3"
                >
                  {isLoading ? (
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Existing Tags Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium text-foreground">
                  Available tags
                </Label>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {tags.length}
                </span>
              </div>
              {hasChanges() && (
                <span className="text-xs text-foreground font-medium">
                  {documentTags.size} selected
                </span>
              )}
            </div>
            
            <div className="space-y-1 max-h-[240px] overflow-y-auto rounded-lg border bg-muted/30 p-2 pl-6">
              {tags.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-2 rounded-full bg-muted mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-medium text-foreground mb-0.5">No tags available</p>
                  <p className="text-xs text-muted-foreground">
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
                        "group flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all cursor-pointer",
                        "hover:bg-accent/50 border border-transparent",
                        isSelected && "bg-accent border-foreground/20"
                      )}
                      onClick={() => !isApplying && toggleTag(tag.id)}
                    >
                      <Checkbox
                        id={tag.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag.id)}
                        disabled={isApplying}
                        className="h-4 w-4 data-[state=checked]:bg-foreground data-[state=checked]:border-foreground"
                      />
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0 border border-background/50",
                          isSelected && "ring-1 ring-foreground/30"
                        )}
                        style={{ backgroundColor: tag.color || "#6b7280" }}
                      />
                      <label
                        htmlFor={tag.id}
                        className={cn(
                          "flex-1 text-sm cursor-pointer select-none",
                          isSelected ? "text-foreground font-medium" : "text-foreground/80"
                        )}
                      >
                        {tag.name}
                      </label>
                      {isSelected && (
                        <Check className="h-3.5 w-3.5 text-foreground flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isApplying}
            className="h-9"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying || !hasChanges()}
            className="h-9"
          >
            {isApplying ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Applying...
              </>
            ) : (
              "Apply changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
