import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Copy, Check, X, UserCheck, Network, UserCog, ExternalLink, LockKeyhole } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { sharingApi } from "@/services/api";
import type { ShareLink, SharePermission, ShareAccess, User } from "@/types/api";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  users?: User[];
}

export const ShareDialog = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  users = [],
}: ShareDialogProps) => {
  const [permission, setPermission] = useState<SharePermission>("view");
  const [access, setAccess] = useState<ShareAccess>("anyone");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [hasExpiry, setHasExpiry] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadShareLinks();
    }
  }, [open, documentId]);

  const loadShareLinks = async () => {
    try {
      const links = await sharingApi.getShareLinks(documentId);
      setShareLinks(links);
    } catch (error) {
      console.error("Failed to load share links:", error);
    }
  };

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    try {
      const newLink = await sharingApi.createShareLink({
        documentId,
        permission,
        access,
        allowedUsers: access === "specific" ? selectedUsers : undefined,
        expiresAt: hasExpiry ? expiresAt : undefined,
      });

      setShareLinks([...shareLinks, newLink]);
      toast({
        title: "Share link created",
        description: "The share link has been created successfully.",
      });

      // Reset form
      setPermission("view");
      setAccess("anyone");
      setSelectedUsers([]);
      setExpiresAt(undefined);
      setHasExpiry(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (link: ShareLink) => {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopiedLinkId(link.id);
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard.",
      });
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevokeLink = async (linkId: string) => {
    try {
      await sharingApi.revokeShareLink(linkId);
      setShareLinks(shareLinks.filter((l) => l.id !== linkId));
      toast({
        title: "Link revoked",
        description: "The share link has been revoked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const getPermissionLabel = (perm: SharePermission) => {
    switch (perm) {
      case "view": return "View only";
      case "comment": return "View & comment";
      case "edit": return "Full access";
    }
  };

  const getAccessLabel = (acc: ShareAccess) => {
    switch (acc) {
      case "anyone": return "Anyone";
      case "team": return "Team";
      case "specific": return "Specific users";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Share document
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Create New Share Link */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Create share link</h3>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                Generate a link with specific permissions and access controls
              </p>
            </div>

            {/* Permission Level */}
            <div className="space-y-1.5">
              <Label htmlFor="permission" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                Permission level
              </Label>
              <div className="space-y-1">
                <Select value={permission} onValueChange={(value) => setPermission(value as SharePermission)}>
                  <SelectTrigger id="permission" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                    <SelectItem value="view" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <LockKeyhole className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>View only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="comment" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>View & comment</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="edit" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCog className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>Full access</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Access Level */}
            <div className="space-y-1.5">
              <Label htmlFor="access" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                Who can access
              </Label>
              <div className="space-y-1">
                <Select value={access} onValueChange={(value) => setAccess(value as ShareAccess)}>
                  <SelectTrigger id="access" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                    <SelectItem value="anyone" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Network className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>Anyone with the link</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="team" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>Team members only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="specific" className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <UserCog className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                        <span>Specific users</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Selection */}
            {access === "specific" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Select users</Label>
                <div className="space-y-1 border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-2 max-h-40 overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
                  {users.length === 0 ? (
                    <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center py-2">No users available</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2 py-0.5">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-xs font-normal leading-none cursor-pointer flex-1 text-[#171717] dark:text-[#fafafa]"
                        >
                          <span>{user.name}</span>
                          <span className="text-[#737373] dark:text-[#a3a3a3] ml-1">({user.email})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Expiry Date */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 flex-1">
                <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Expiration date</Label>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                  Set when this link should expire
                </p>
              </div>
              <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
            </div>

            {hasExpiry && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-8 text-xs border-[#e5e5e5] dark:border-[#262626]",
                      !expiresAt && "text-[#737373] dark:text-[#a3a3a3]"
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {expiresAt ? format(expiresAt, "PPP") : "Select expiration date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiresAt}
                    onSelect={setExpiresAt}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button 
              onClick={handleCreateShareLink} 
              disabled={isLoading} 
              className="w-full h-8 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
            >
              {isLoading ? (
                <>
                  <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                "Create share link"
              )}
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Existing Share Links */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Active share links</h3>
              <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                Manage existing share links for this document
              </p>
            </div>
            {shareLinks.length === 0 ? (
              <div className="text-center py-6 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a]">
                <ExternalLink className="h-6 w-6 text-[#737373]/50 dark:text-[#a3a3a3]/50 mx-auto mb-1.5" />
                <p className="text-xs text-[#737373] dark:text-[#a3a3a3] font-medium">No active share links</p>
                <p className="text-[10px] text-[#737373]/70 dark:text-[#a3a3a3]/70 mt-0.5">Create one above to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-start justify-between gap-2 p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-white dark:bg-[#171717] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] font-normal border-[#e5e5e5] dark:border-[#262626]">
                          {getPermissionLabel(link.permission)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                          {getAccessLabel(link.access)}
                        </Badge>
                        {link.expiresAt && (
                          <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                            Expires {format(link.expiresAt, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Input
                          value={link.shareUrl}
                          readOnly
                          className="h-7 text-[10px] font-mono bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                          onClick={() => handleCopyLink(link)}
                        >
                          {copiedLinkId === link.id ? (
                            <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 flex-shrink-0 text-[#737373] dark:text-[#a3a3a3] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                          onClick={() => handleRevokeLink(link.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
