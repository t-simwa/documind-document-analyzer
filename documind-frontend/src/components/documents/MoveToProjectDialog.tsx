import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { useState } from "react";
import { documentsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface MoveToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  onUpdate: () => void;
}

export const MoveToProjectDialog = ({
  open,
  onOpenChange,
  documentId,
  onUpdate,
}: MoveToProjectDialogProps) => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const { toast } = useToast();

  const handleMove = async () => {
    if (!documentId) return;

    setIsMoving(true);
    try {
      await documentsApi.update(documentId, { projectId });
      toast({
        title: "Success",
        description: "Document moved successfully",
      });
      onUpdate();
      onOpenChange(false);
      setProjectId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move document",
        variant: "destructive",
      });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Move to project</DialogTitle>
          <DialogDescription>
            Select a project to move this document to
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Project</Label>
            <ProjectSelector
              value={projectId}
              onChange={setProjectId}
              placeholder="Select a project (or leave empty for no project)"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move document"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
