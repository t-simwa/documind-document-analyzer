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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Share document
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Create New Share Link */}
          <div className="space-y-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Create share link</h3>
              <p className="text-xs text-muted-foreground">
                Generate a link with specific permissions and access controls
              </p>
            </div>

            {/* Permission Level */}
            <div className="space-y-2">
              <Label htmlFor="permission" className="text-sm font-medium text-foreground">
                Permission level
              </Label>
              <Select value={permission} onValueChange={(value) => setPermission(value as SharePermission)}>
                <SelectTrigger id="permission" className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <LockKeyhole className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>View only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="comment">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>View & comment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Full access</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Access Level */}
            <div className="space-y-2">
              <Label htmlFor="access" className="text-sm font-medium text-foreground">
                Who can access
              </Label>
              <Select value={access} onValueChange={(value) => setAccess(value as ShareAccess)}>
                <SelectTrigger id="access" className="h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anyone">
                    <div className="flex items-center gap-2">
                      <Network className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Anyone with the link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="team">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Team members only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="specific">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Specific users</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Selection */}
            {access === "specific" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Select users</Label>
                <div className="border border-border/50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2.5 bg-card/30">
                  {users.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No users available</p>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2.5">
                        <Checkbox
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <label
                          htmlFor={`user-${user.id}`}
                          className="text-sm font-normal leading-none cursor-pointer flex-1"
                        >
                          <span className="text-foreground">{user.name}</span>
                          <span className="text-muted-foreground ml-1.5">({user.email})</span>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Expiry Date */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium text-foreground">Expiration date</Label>
                <p className="text-xs text-muted-foreground">
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
                      "w-full justify-start text-left font-normal h-10 text-sm",
                      !expiresAt && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
              className="w-full h-10"
            >
              {isLoading ? "Creating..." : "Create share link"}
            </Button>
          </div>

          <Separator />

          {/* Existing Share Links */}
          <div className="space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Active share links</h3>
              <p className="text-xs text-muted-foreground">
                Manage existing share links for this document
              </p>
            </div>
            {shareLinks.length === 0 ? (
              <div className="text-center py-8 border border-border/50 rounded-lg bg-muted/20">
                <ExternalLink className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No active share links</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">Create one above to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="group flex items-start justify-between gap-3 p-3.5 border border-border/50 rounded-lg bg-card/50 hover:bg-card hover:border-border transition-all duration-200"
                  >
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs font-normal border-border/60">
                          {getPermissionLabel(link.permission)}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {getAccessLabel(link.access)}
                        </Badge>
                        {link.expiresAt && (
                          <span className="text-xs text-muted-foreground">
                            Expires {format(link.expiresAt, "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Input
                          value={link.shareUrl}
                          readOnly
                          className="h-8 text-xs font-mono bg-background/50 border-border/50"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => handleCopyLink(link)}
                        >
                          {copiedLinkId === link.id ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 flex-shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRevokeLink(link.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
