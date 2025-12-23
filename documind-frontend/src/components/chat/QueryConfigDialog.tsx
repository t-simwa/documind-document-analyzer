import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QueryConfig } from "@/types/query";
import { DEFAULT_QUERY_CONFIG } from "@/types/query";

interface QueryConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: QueryConfig;
  onConfigChange: (config: QueryConfig) => void;
}

export const QueryConfigDialog = ({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: QueryConfigDialogProps) => {
  const [localConfig, setLocalConfig] = useState<QueryConfig>(config);

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleSave = () => {
    onConfigChange(localConfig);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_QUERY_CONFIG);
  };

  return (
    <>
      <style>{`
        .query-config-slider span[class*="bg-primary"] {
          background-color: #171717 !important;
        }
        .dark .query-config-slider span[class*="bg-primary"] {
          background-color: #fafafa !important;
        }
        .query-config-slider span[role="slider"] {
          border-color: #171717 !important;
        }
        .dark .query-config-slider span[role="slider"] {
          border-color: #fafafa !important;
        }
      `}</style>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
              Query settings
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Form Content */}
        <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Search Configuration */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Search className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Search configuration</Label>
            </div>
            
            <div className="space-y-3 pl-4.5">
              <div className="space-y-1.5">
                <Label htmlFor="search_type" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Search type
                </Label>
                <div className="space-y-1">
                  <Select
                    value={localConfig.search_type}
                    onValueChange={(value: "vector" | "keyword" | "hybrid") =>
                      setLocalConfig({ ...localConfig, search_type: value })
                    }
                  >
                    <SelectTrigger id="search_type" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                      <SelectItem value="hybrid" className="text-xs">Hybrid</SelectItem>
                      <SelectItem value="vector" className="text-xs">Vector (Semantic)</SelectItem>
                      <SelectItem value="keyword" className="text-xs">Keyword (BM25)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Hybrid combines vector and keyword search for optimal results
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top_k" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    Top K results
                  </Label>
                  <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa] tabular-nums">
                    {localConfig.top_k}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="px-1 query-config-slider">
                    <Slider
                      id="top_k"
                      min={1}
                      max={20}
                      step={1}
                      value={[localConfig.top_k]}
                      onValueChange={([value]) =>
                        setLocalConfig({ ...localConfig, top_k: value })
                      }
                    />
                  </div>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Number of document chunks to retrieve
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="rerank" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    Re-ranking
                  </Label>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Re-rank results for improved relevance
                  </p>
                </div>
                <Switch
                  id="rerank"
                  checked={localConfig.rerank_enabled}
                  onCheckedChange={(checked) =>
                    setLocalConfig({ ...localConfig, rerank_enabled: checked })
                  }
                />
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Generation Configuration */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
              <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Generation configuration</Label>
            </div>
            
            <div className="space-y-3 pl-4.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                    Temperature
                  </Label>
                  <span className="text-xs font-medium text-[#171717] dark:text-[#fafafa] tabular-nums">
                    {localConfig.temperature.toFixed(1)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="px-1 query-config-slider">
                    <Slider
                      id="temperature"
                      min={0}
                      max={20}
                      step={1}
                      value={[localConfig.temperature * 10]}
                      onValueChange={([value]) =>
                        setLocalConfig({ ...localConfig, temperature: value / 10 })
                      }
                    />
                  </div>
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Controls response randomness (0.0 = focused, 2.0 = creative)
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_tokens" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Max tokens
                </Label>
                <div className="space-y-1">
                  <Input
                    id="max_tokens"
                    type="number"
                    min={100}
                    max={8000}
                    step={100}
                    value={localConfig.max_tokens}
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        max_tokens: parseInt(e.target.value) || 2000,
                      })
                    }
                    className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
                  />
                  <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    Maximum length of generated response
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Additional Options */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Additional options</Label>
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="generate_insights" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                  Generate insights
                </Label>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                  Extract key points and entities from responses
                </p>
              </div>
              <Switch
                id="generate_insights"
                checked={localConfig.generate_insights}
                onCheckedChange={(checked) =>
                  setLocalConfig({ ...localConfig, generate_insights: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-between gap-2">
          <Button 
            variant="ghost" 
            onClick={handleReset}
            className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
            >
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

