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
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Move to project</DialogTitle>
            <DialogDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
              Select a project to move this document to
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Project</Label>
            <ProjectSelector
              value={projectId}
              onChange={setProjectId}
              placeholder="Select a project (or leave empty for no project)"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isMoving}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={isMoving}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isMoving ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Moving...
              </>
            ) : (
              "Move document"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
