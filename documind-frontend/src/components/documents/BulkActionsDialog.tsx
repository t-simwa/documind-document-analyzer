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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk actions</DialogTitle>
          <DialogDescription>
            Apply actions to {selectedIds.length} selected {selectedIds.length === 1 ? "document" : "documents"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Action</Label>
            <Select value={action} onValueChange={(value: any) => setAction(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tag">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Add tags
                  </div>
                </SelectItem>
                <SelectItem value="untag">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Remove tags
                  </div>
                </SelectItem>
                <SelectItem value="move">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Move to project
                  </div>
                </SelectItem>
                <SelectItem value="delete">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {action === "tag" && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select tags</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={tag.id}
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <label
                        htmlFor={tag.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select tags to remove</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No tags available</p>
                ) : (
                  tags.map((tag) => (
                    <div key={tag.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={tag.id}
                        checked={selectedTags.has(tag.id)}
                        onCheckedChange={() => toggleTag(tag.id)}
                      />
                      <label
                        htmlFor={tag.id}
                        className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full"
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
            <div className="space-y-2">
              <Label className="text-sm font-medium">Move to project</Label>
              <ProjectSelector
                value={projectId}
                onChange={setProjectId}
                placeholder="Select a project"
              />
            </div>
          )}

          {action === "delete" && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    This action cannot be undone
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    All selected documents will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
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
          >
            {isProcessing ? "Processing..." : action === "delete" ? "Delete documents" : "Apply"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
