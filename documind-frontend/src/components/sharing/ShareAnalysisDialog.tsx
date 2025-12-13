import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Copy, Check, ExternalLink, MessageCircleMore, FileCode } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { analysisShareApi } from "@/services/api";

interface ShareAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  hasChatHistory: boolean;
  hasSummary: boolean;
}

export const ShareAnalysisDialog = ({
  open,
  onOpenChange,
  documentId,
  documentName,
  hasChatHistory,
  hasSummary,
}: ShareAnalysisDialogProps) => {
  const [includesChatHistory, setIncludesChatHistory] = useState(hasChatHistory);
  const [includesSummary, setIncludesSummary] = useState(hasSummary);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [hasExpiry, setHasExpiry] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    try {
      const result = await analysisShareApi.createAnalysisShareLink(
        documentId,
        includesChatHistory,
        includesSummary,
        hasExpiry ? expiresAt : undefined
      );

      setShareLink(result.shareUrl);
      toast({
        title: "Analysis share link created",
        description: "The share link has been created successfully.",
      });
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

  const handleCopyLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setIncludesChatHistory(hasChatHistory);
    setIncludesSummary(hasSummary);
    setExpiresAt(undefined);
    setHasExpiry(false);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Share analysis
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!shareLink ? (
            <>
              {/* Include Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">What to include</Label>
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg border border-border/50 bg-card/30">
                    <Checkbox
                      id="chat-history"
                      checked={includesChatHistory}
                      onCheckedChange={(checked) =>
                        setIncludesChatHistory(checked as boolean)
                      }
                      disabled={!hasChatHistory}
                    />
                    <label
                      htmlFor="chat-history"
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <MessageCircleMore className="h-4 w-4 text-muted-foreground" />
                      <span>Chat History</span>
                      {!hasChatHistory && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          (Not available)
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2.5 p-3 rounded-lg border border-border/50 bg-card/30">
                    <Checkbox
                      id="summary"
                      checked={includesSummary}
                      onCheckedChange={(checked) =>
                        setIncludesSummary(checked as boolean)
                      }
                      disabled={!hasSummary}
                    />
                    <label
                      htmlFor="summary"
                      className="text-sm font-normal cursor-pointer flex-1 flex items-center gap-2"
                    >
                      <FileCode className="h-4 w-4 text-muted-foreground" />
                      <span>Summary</span>
                      {!hasSummary && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          (Not available)
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

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

              {!includesChatHistory && !includesSummary && (
                <div className="text-center py-4 border border-border/50 rounded-lg bg-muted/20">
                  <p className="text-xs text-muted-foreground font-medium">
                    Please select at least one option to share
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="p-4 border border-border/50 rounded-lg bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm font-medium text-foreground">Share link</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="h-9 text-xs font-mono bg-background/50 border-border/50"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="h-9 w-9 p-0 flex-shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2.5">
                  Anyone with this link can view the shared analysis
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          {!shareLink ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isLoading} className="h-9">
                Cancel
              </Button>
              <Button
                onClick={handleCreateShareLink}
                disabled={
                  isLoading ||
                  (!includesChatHistory && !includesSummary)
                }
                className="h-9"
              >
                {isLoading ? "Creating..." : "Create share link"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} className="h-9">Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
