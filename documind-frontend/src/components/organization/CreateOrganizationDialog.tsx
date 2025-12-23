import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { organizationsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OrganizationIcon } from "./OrganizationIcons";
import { cn } from "@/lib/utils";

interface CreateOrganizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrganizationDialogProps) {
  const [name, setName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { refreshUser, user: currentUser } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Organization name required",
        description: "Please enter a name for your organization.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const organization = await organizationsApi.create({ name: name.trim() });
      console.log("Organization created:", organization);
      
      // Close dialog immediately
      setName("");
      onOpenChange(false);
      
      // Show success toast
      toast({
        title: "Organization created",
        description: "Your organization has been created successfully!",
      });
      
      // Wait a moment for backend to persist the user update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refresh user to get organization_id - this is critical for UI update
      try {
        const refreshedUser = await refreshUser();
        console.log("User refreshed after org creation, organization_id:", refreshedUser?.organization_id);
        
        // If organization_id is still null, wait and retry
        if (!refreshedUser?.organization_id) {
          console.warn("organization_id is still null, retrying...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryUser = await refreshUser();
          console.log("After retry, organization_id:", retryUser?.organization_id);
        }
        
        // Call onSuccess callback to trigger dashboard updates
        // The callback will handle another refreshUser call to ensure state is synced
        if (onSuccess) {
          // Use requestAnimationFrame to ensure React has processed the state update
          requestAnimationFrame(() => {
            setTimeout(() => {
              console.log("Calling onSuccess callback");
              onSuccess();
            }, 100);
          });
        } else {
          // Fallback: navigate to organization settings if no callback provided
          setTimeout(() => {
            navigate("/app/organization/settings");
          }, 300);
        }
      } catch (refreshError) {
        console.error("Failed to refresh user after org creation:", refreshError);
        toast({
          title: "Organization created",
          description: "Redirecting to organization settings...",
        });
        // Navigate to settings as fallback
        setTimeout(() => {
          navigate("/app/organization/settings");
        }, 1000);
      }
    } catch (error) {
      toast({
        title: "Failed to create organization",
        description: error instanceof Error ? error.message : "Could not create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Create organization
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Organization Details */}
          <div className="space-y-1.5">
            <Label htmlFor="org-name" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
              Organization name
            </Label>
            <div className="space-y-1">
              <Input
                id="org-name"
                placeholder="Acme Corporation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating && name.trim()) {
                    handleCreate();
                  }
                }}
                disabled={isCreating}
                autoFocus
                className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
              />
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                This name will be used to identify your organization across the platform
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !name.trim()}
            className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isCreating ? (
              <>
                <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              "Create organization"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

