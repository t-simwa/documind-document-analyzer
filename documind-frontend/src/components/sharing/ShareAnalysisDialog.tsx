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
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Share analysis
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {!shareLink ? (
            <>
              {/* Include Options */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">What to include</Label>
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]">
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
                      className="text-xs font-normal cursor-pointer flex-1 flex items-center gap-1.5 text-[#171717] dark:text-[#fafafa]"
                    >
                      <MessageCircleMore className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <span>Chat History</span>
                      {!hasChatHistory && (
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] ml-auto">
                          (Not available)
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="flex items-center space-x-2 p-2 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a]">
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
                      className="text-xs font-normal cursor-pointer flex-1 flex items-center gap-1.5 text-[#171717] dark:text-[#fafafa]"
                    >
                      <FileCode className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
                      <span>Summary</span>
                      {!hasSummary && (
                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3] ml-auto">
                          (Not available)
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </div>

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

              {!includesChatHistory && !includesSummary && (
                <div className="text-center py-3 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a]">
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] font-medium">
                    Please select at least one option to share
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Share link</Label>
              <div className="space-y-1">
                <div className="p-2.5 border border-[#e5e5e5] dark:border-[#262626] rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a]">
                  <div className="flex items-center gap-1.5">
                    <Input
                      value={shareLink}
                      readOnly
                      className="h-7 text-[10px] font-mono bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626]"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyLink}
                      className="h-7 w-7 p-0 flex-shrink-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-white dark:hover:bg-[#171717]"
                    >
                      {copied ? (
                        <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-2">
                    Anyone with this link can view the shared analysis
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
          {!shareLink ? (
            <>
              <Button 
                variant="ghost" 
                onClick={handleClose} 
                disabled={isLoading}
                className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateShareLink}
                disabled={
                  isLoading ||
                  (!includesChatHistory && !includesSummary)
                }
                className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
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
            </>
          ) : (
            <Button 
              onClick={handleClose}
              className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
            >
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
