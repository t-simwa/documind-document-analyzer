import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/api";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; parentId?: string | null }) => Promise<void>;
  project?: Project | null;
  projects?: Project[];
}

export const ProjectDialog = ({ open, onOpenChange, onSave, project, projects = [] }: ProjectDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setParentId(project.parentId || null);
    } else {
      setName("");
      setDescription("");
      setParentId(null);
    }
    setNameError(null);
  }, [project, open]);

  const validateName = (value: string) => {
    if (!value.trim()) {
      setNameError("Project name is required");
      return false;
    }
    if (value.trim().length < 2) {
      setNameError("Project name must be at least 2 characters");
      return false;
    }
    if (value.trim().length > 100) {
      setNameError("Project name must be less than 100 characters");
      return false;
    }
    setNameError(null);
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) {
      validateName(value);
    }
  };

  const handleSave = async () => {
    if (!validateName(name)) return;

    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, parentId });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save project:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Flatten projects for select (excluding current project and its children)
  const availableProjects = projects.filter((p) => p.id !== project?.id);
  const selectedParent = availableProjects.find((p) => p.id === parentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {project ? "Edit project" : "New project"}
            </DialogTitle>
            {project && (
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Update your project details
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Project name
            </Label>
            <div className="space-y-1.5">
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => validateName(name)}
                disabled={isSaving}
                className={cn(
                  "h-10 text-sm",
                  nameError && "border-destructive focus-visible:ring-destructive"
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim() && !nameError) {
                    e.preventDefault();
                    handleSave();
                  }
                }}
              />
               {nameError && (
                 <p className="text-xs text-destructive font-medium">{nameError}</p>
               )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Description
              <span className="text-xs font-normal text-muted-foreground ml-1.5">(optional)</span>
            </Label>
            <div className="space-y-1.5">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a brief description of this project's purpose..."
                rows={3}
                disabled={isSaving}
                className="resize-none text-sm min-h-[80px]"
                maxLength={500}
              />
               {description.length > 0 && (
                 <p className="text-xs text-muted-foreground tabular-nums text-right">
                   {description.length}/500
                 </p>
               )}
            </div>
          </div>

          {/* Parent Project */}
          <div className="space-y-2">
            <Label htmlFor="parent" className="text-sm font-medium text-foreground">
              Parent project
              <span className="text-xs font-normal text-muted-foreground ml-1.5">(optional)</span>
            </Label>
            <div className="space-y-1.5">
              <Select
                value={parentId || "none"}
                onValueChange={(value) => setParentId(value === "none" ? null : value)}
                disabled={isSaving}
              >
                <SelectTrigger id="parent" className="h-10 text-sm">
                  <SelectValue placeholder="Select a parent project">
                    {selectedParent ? (
                      <div className="flex items-center gap-2">
                        <FolderTree className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedParent.name}</span>
                      </div>
                    ) : (
                      "None (root level)"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                      </div>
                      <span>None (root level)</span>
                    </div>
                  </SelectItem>
                  {availableProjects.length > 0 && (
                    <>
                      {availableProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <FolderTree className="h-4 w-4 text-muted-foreground" />
                            <span>{p.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                 </SelectContent>
               </Select>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving}
            className="h-9"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim() || !!nameError}
            className="h-9 min-w-[100px]"
          >
            {isSaving ? (
              <>
                <span className="mr-2 h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : project ? (
              "Save changes"
            ) : (
              "Create project"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
