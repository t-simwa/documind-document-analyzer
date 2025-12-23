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
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              {project ? "Edit project" : "New project"}
            </DialogTitle>
            {project && (
              <DialogDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                Update your project details
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
              Project name
            </Label>
            <div className="space-y-1">
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                onBlur={() => validateName(name)}
                disabled={isSaving}
                className={cn(
                  "h-8 text-xs border-[#e5e5e5] dark:border-[#262626]",
                  nameError && "border-red-500 dark:border-red-400 focus-visible:ring-red-500"
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
                 <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">{nameError}</p>
               )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
              Description
              <span className="text-[10px] font-normal text-[#737373] dark:text-[#a3a3a3] ml-1.5">(optional)</span>
            </Label>
            <div className="space-y-1">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a brief description of this project's purpose..."
                rows={3}
                disabled={isSaving}
                className="resize-none text-xs min-h-[70px] border-[#e5e5e5] dark:border-[#262626]"
                maxLength={500}
              />
               {description.length > 0 && (
                 <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] tabular-nums text-right">
                   {description.length}/500
                 </p>
               )}
            </div>
          </div>

          {/* Parent Project */}
          <div className="space-y-1.5">
            <Label htmlFor="parent" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
              Parent project
              <span className="text-[10px] font-normal text-[#737373] dark:text-[#a3a3a3] ml-1.5">(optional)</span>
            </Label>
            <div className="space-y-1">
              <Select
                value={parentId || "none"}
                onValueChange={(value) => setParentId(value === "none" ? null : value)}
                disabled={isSaving}
              >
                <SelectTrigger id="parent" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                  <SelectValue placeholder="Select a parent project">
                    {selectedParent ? (
                      <div className="flex items-center gap-1.5">
                        <FolderTree className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>{selectedParent.name}</span>
                      </div>
                    ) : (
                      "None (root level)"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                  <SelectItem value="none" className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-3 w-3 flex items-center justify-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#737373]/40 dark:bg-[#a3a3a3]/40" />
                      </div>
                      <span>None (root level)</span>
                    </div>
                  </SelectItem>
                  {availableProjects.length > 0 && (
                    <>
                      {availableProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          <div className="flex items-center gap-1.5">
                            <FolderTree className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
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
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isSaving}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim() || !!nameError}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isSaving ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
