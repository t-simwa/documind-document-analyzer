import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { documentsApi, tagsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { DocumentTag } from "@/types/api";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  onUpdate: () => void;
  tags: DocumentTag[];
}

export const TagDialog = ({ open, onOpenChange, documentId, onUpdate, tags }: TagDialogProps) => {
  const [documentTags, setDocumentTags] = useState<Set<string>>(new Set());
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      setDocumentTags(new Set(doc.tags));
    } catch (error) {
      console.error("Failed to load document tags:", error);
    }
  };

  const toggleTag = async (tagId: string) => {
    if (!documentId) return;

    const newSet = new Set(documentTags);
    const isAdding = !newSet.has(tagId);

    if (isAdding) {
      newSet.add(tagId);
    } else {
      newSet.delete(tagId);
    }

    setDocumentTags(newSet);

    try {
      await documentsApi.update(documentId, { tags: Array.from(newSet) });
      onUpdate();
    } catch (error) {
      // Revert on error
      setDocumentTags(new Set(documentTags));
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    try {
      setIsLoading(true);
      const newTag = await tagsApi.create(newTagName.trim());
      await toggleTag(newTag.id);
      setNewTagName("");
      toast({
        title: "Success",
        description: "Tag created and added to document",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
          <DialogDescription>
            Add or remove tags from this document
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Create New Tag */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Create new tag</Label>
            <div className="flex gap-2">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTag();
                  }
                }}
                disabled={isLoading}
                className="h-9"
              />
              <Button 
                onClick={handleCreateTag} 
                disabled={isLoading || !newTagName.trim()}
                size="icon"
                className="h-9 w-9"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing Tags */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Available tags</Label>
            <div className="space-y-1 max-h-64 overflow-y-auto border rounded-lg p-3 bg-muted/30">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tags available. Create one above.
                </p>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-3 py-1.5">
                    <Checkbox
                      id={tag.id}
                      checked={documentTags.has(tag.id)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
