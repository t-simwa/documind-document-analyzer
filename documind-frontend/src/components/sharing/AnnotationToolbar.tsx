import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Highlighter, StickyNote, Type, PenTool, X, SwatchBook } from "lucide-react";
import { cn } from "@/lib/utils";

export type AnnotationMode = "none" | "highlight" | "note" | "text" | "drawing";

interface AnnotationToolbarProps {
  mode: AnnotationMode;
  onModeChange: (mode: AnnotationMode) => void;
  onClear?: () => void;
  className?: string;
}

const colors = [
  { value: "#fbbf24", name: "Yellow" },
  { value: "#60a5fa", name: "Blue" },
  { value: "#34d399", name: "Green" },
  { value: "#f87171", name: "Red" },
  { value: "#a78bfa", name: "Purple" },
  { value: "#fb7185", name: "Pink" },
];

export const AnnotationToolbar = ({
  mode,
  onModeChange,
  onClear,
  className,
}: AnnotationToolbarProps) => {
  const [selectedColor, setSelectedColor] = useState(colors[0].value);

  return (
    <div className={cn("flex items-center gap-1 p-2 bg-card/50 border border-border/50 rounded-lg backdrop-blur-sm", className)}>
      <Button
        variant={mode === "highlight" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(mode === "highlight" ? "none" : "highlight")}
        className={cn(
          "h-8 w-8 p-0",
          mode === "highlight" && "bg-primary text-primary-foreground"
        )}
        title="Highlight"
      >
        <Highlighter className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant={mode === "note" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(mode === "note" ? "none" : "note")}
        className={cn(
          "h-8 w-8 p-0",
          mode === "note" && "bg-primary text-primary-foreground"
        )}
        title="Add Note"
      >
        <StickyNote className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant={mode === "text" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(mode === "text" ? "none" : "text")}
        className={cn(
          "h-8 w-8 p-0",
          mode === "text" && "bg-primary text-primary-foreground"
        )}
        title="Add Text"
      >
        <Type className="h-3.5 w-3.5" />
      </Button>

      <Button
        variant={mode === "drawing" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange(mode === "drawing" ? "none" : "drawing")}
        className={cn(
          "h-8 w-8 p-0",
          mode === "drawing" && "bg-primary text-primary-foreground"
        )}
        title="Draw"
      >
        <PenTool className="h-3.5 w-3.5" />
      </Button>

      {mode !== "none" && (
        <>
          <Separator orientation="vertical" className="h-6 mx-0.5" />

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 hover:bg-muted/50"
                title="Select color"
              >
                <div className="relative">
                  <SwatchBook className="h-3.5 w-3.5 text-muted-foreground" />
                  <div
                    className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background"
                    style={{ backgroundColor: selectedColor }}
                  />
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2.5" align="start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground mb-2">Select color</p>
                <div className="grid grid-cols-3 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={cn(
                        "h-7 w-7 rounded border-2 transition-all hover:scale-110",
                        selectedColor === color.value 
                          ? "border-foreground ring-2 ring-foreground/20" 
                          : "border-border/50"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {onClear && (
            <>
              <Separator orientation="vertical" className="h-6 mx-0.5" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClear} 
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Clear annotations"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};
