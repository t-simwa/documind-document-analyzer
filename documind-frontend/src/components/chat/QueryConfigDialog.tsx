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
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              Query settings
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium text-foreground">Search configuration</Label>
            </div>
            
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="search_type" className="text-sm font-medium text-foreground">
                  Search type
                </Label>
                <Select
                  value={localConfig.search_type}
                  onValueChange={(value: "vector" | "keyword" | "hybrid") =>
                    setLocalConfig({ ...localConfig, search_type: value })
                  }
                >
                  <SelectTrigger id="search_type" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="vector">Vector (Semantic)</SelectItem>
                    <SelectItem value="keyword">Keyword (BM25)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Hybrid combines vector and keyword search for optimal results
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="top_k" className="text-sm font-medium text-foreground">
                    Top K results
                  </Label>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {localConfig.top_k}
                  </span>
                </div>
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
                <p className="text-xs text-muted-foreground">
                  Number of document chunks to retrieve
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="rerank" className="text-sm font-medium text-foreground">
                    Re-ranking
                  </Label>
                  <p className="text-xs text-muted-foreground">
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

          <Separator />

          {/* Generation Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium text-foreground">Generation configuration</Label>
            </div>
            
            <div className="space-y-4 pl-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature" className="text-sm font-medium text-foreground">
                    Temperature
                  </Label>
                  <span className="text-sm font-medium text-foreground tabular-nums">
                    {localConfig.temperature.toFixed(1)}
                  </span>
                </div>
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
                <p className="text-xs text-muted-foreground">
                  Controls response randomness (0.0 = focused, 2.0 = creative)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_tokens" className="text-sm font-medium text-foreground">
                  Max tokens
                </Label>
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
                  className="h-10 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of generated response
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Additional options</Label>
            <div className="flex items-center justify-between py-2 pl-6">
              <div className="space-y-0.5 flex-1">
                <Label htmlFor="generate_insights" className="text-sm font-medium text-foreground">
                  Generate insights
                </Label>
                <p className="text-xs text-muted-foreground">
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
        <DialogFooter className="px-6 py-4 border-t border-border/50 bg-card/30">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="h-9"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-2" />
            Reset to defaults
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              className="h-9"
            >
              Save changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

