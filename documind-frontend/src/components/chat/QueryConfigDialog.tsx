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
import { Settings2 } from "lucide-react";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Query Configuration
          </DialogTitle>
          <DialogDescription>
            Configure how queries are processed and responses are generated
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Search Configuration</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search_type">Search Type</Label>
                  <Select
                    value={localConfig.search_type}
                    onValueChange={(value: "vector" | "keyword" | "hybrid") =>
                      setLocalConfig({ ...localConfig, search_type: value })
                    }
                  >
                    <SelectTrigger id="search_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">
                        Hybrid (Recommended)
                      </SelectItem>
                      <SelectItem value="vector">Vector (Semantic)</SelectItem>
                      <SelectItem value="keyword">Keyword (BM25)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Hybrid combines vector and keyword search for best results
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="top_k">
                    Top K Results: {localConfig.top_k}
                  </Label>
                  <Slider
                    id="top_k"
                    min={1}
                    max={20}
                    step={1}
                    value={[localConfig.top_k]}
                    onValueChange={([value]) =>
                      setLocalConfig({ ...localConfig, top_k: value })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of document chunks to retrieve (1-20)
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="rerank">Re-ranking</Label>
                    <p className="text-xs text-muted-foreground">
                      Re-rank results for better relevance
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
          </div>

          <Separator />

          {/* LLM Configuration */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">LLM Configuration</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature: {localConfig.temperature.toFixed(1)}
                  </Label>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[localConfig.temperature]}
                    onValueChange={([value]) =>
                      setLocalConfig({ ...localConfig, temperature: value })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls randomness (0.0 = deterministic, 2.0 = creative)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Max Tokens</Label>
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum length of generated response (100-8000)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Additional Options */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Additional Options</h3>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="generate_insights">Generate Insights</Label>
                  <p className="text-xs text-muted-foreground">
                    Extract key points and entities from response
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
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Configuration</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

