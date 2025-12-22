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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Create organization
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Organization Details */}
          <div className="space-y-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-sm font-medium text-foreground">
                  Organization name
                </Label>
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
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  This name will be used to identify your organization across the platform
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
            className="h-9"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating || !name.trim()}
            className="h-9"
          >
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create organization
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

