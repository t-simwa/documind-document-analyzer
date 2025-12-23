import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Tag, Folder, AlertTriangle } from "lucide-react";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { cn } from "@/lib/utils";
import type { BulkActionRequest, DocumentTag } from "@/types/api";

interface BulkActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onAction: (request: BulkActionRequest) => Promise<void>;
  tags: DocumentTag[];
}

export const BulkActionsDialog = ({
  open,
  onOpenChange,
  selectedIds,
  onAction,
  tags,
}: BulkActionsDialogProps) => {
  const [action, setAction] = useState<"delete" | "tag" | "untag" | "move">("tag");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    setIsProcessing(true);
    try {
      const request: BulkActionRequest = {
        documentIds: selectedIds,
        action,
        payload: {},
      };

      if (action === "tag" || action === "untag") {
        request.payload = { tags: Array.from(selectedTags) };
      } else if (action === "move") {
        request.payload = { projectId };
      }

      await onAction(request);
      // Reset form
      setAction("tag");
      setSelectedTags(new Set());
      setProjectId(null);
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTag = (tagId: string) => {
    const newSet = new Set(selectedTags);
    if (newSet.has(tagId)) {
      newSet.delete(tagId);
    } else {
      newSet.add(tagId);
    }
    setSelectedTags(newSet);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Bulk actions</DialogTitle>
            <DialogDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              Apply actions to {selectedIds.length} selected {selectedIds.length === 1 ? "document" : "documents"}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Action</Label>
            <div className="space-y-1">
              <Select value={action} onValueChange={(value: any) => setAction(value)}>
                <SelectTrigger className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                  <SelectItem value="tag" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      Add tags
                    </div>
                  </SelectItem>
                  <SelectItem value="untag" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      Remove tags
                    </div>
                  </SelectItem>
                  <SelectItem value="move" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Folder className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      Move to project
                    </div>
                  </SelectItem>
                  <SelectItem value="delete" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <Trash2 className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      Delete
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {action === "tag" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Select tags</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-2 bg-[#fafafa] dark:bg-[#0a0a0a]">
                {tags.length === 0 ? (
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center py-3">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2 py-0.5">
                      <Checkbox
                        id={tag.id}
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <label
                        htmlFor={tag.id}
                        className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer flex-1 text-[#171717] dark:text-[#fafafa]"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        {tag.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {action === "untag" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Select tags to remove</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-2 bg-[#fafafa] dark:bg-[#0a0a0a]">
                {tags.length === 0 ? (
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center py-3">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-2 py-0.5">
                      <Checkbox
                        id={tag.id}
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <label
                        htmlFor={tag.id}
                        className="text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5 cursor-pointer flex-1 text-[#171717] dark:text-[#fafafa]"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color || "#6b7280" }}
                        />
                        {tag.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {action === "move" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Move to project</Label>
              <div className="space-y-1">
                <ProjectSelector
                  value={projectId}
                  onChange={setProjectId}
                  placeholder="Select a project"
                />
              </div>
            </div>
          )}

          {action === "delete" && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <div className="flex gap-2">
                <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-red-900 dark:text-red-100">
                    This action cannot be undone
                  </p>
                  <p className="text-[10px] text-red-700 dark:text-red-300">
                    All selected documents will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isProcessing}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isProcessing ||
              ((action === "tag" || action === "untag") && selectedTags.size === 0) ||
              (action === "move" && projectId === undefined)
            }
            variant={action === "delete" ? "destructive" : "default"}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isProcessing ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : action === "delete" ? (
              "Delete documents"
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
