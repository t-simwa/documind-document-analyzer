import { cn } from "@/lib/utils";
import { User, FileText, ExternalLink, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Citation {
  text: string;
  page?: number;
  section?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  isLoading?: boolean;
  timestamp?: Date;
  onCitationClick?: (citation: Citation) => void;
}

const ResponseCard = ({ content, citations, onCitationClick }: { content: string; citations?: Citation[]; onCitationClick?: (citation: Citation) => void }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap font-sans">
        {content}
      </div>

      {citations && citations.length > 0 && (
        <div className="pt-3 border-t border-border/50">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5 font-sans">
            Sources
          </p>
          <div className="space-y-1.5">
            {citations.map((citation, index) => (
              <button
                key={index}
                onClick={() => onCitationClick?.(citation)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-md border border-border/50 hover:bg-muted/50 hover:border-border transition-all text-left group cursor-pointer"
              >
                <div className="flex-shrink-0 w-5 h-5 rounded bg-muted/50 flex items-center justify-center">
                  <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate font-sans">{citation.text}</p>
                  {(citation.page || citation.section) && (
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {citation.page && `Page ${citation.page}`}
                      {citation.page && citation.section && " · "}
                      {citation.section}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-0.5 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFeedback('up')}
          className={cn(
            "h-7 w-7 p-0",
            feedback === 'up' 
              ? "text-foreground bg-muted/50" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFeedback('down')}
          className={cn(
            "h-7 w-7 p-0",
            feedback === 'down' 
              ? "text-foreground bg-muted/50" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-1">
    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '0ms' }} />
    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '150ms' }} />
    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-pulse" style={{ animationDelay: '300ms' }} />
  </div>
);

export const ChatMessage = ({
  role,
  content,
  citations,
  isLoading,
  timestamp,
  onCitationClick,
}: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium",
        isUser 
          ? "bg-foreground text-background" 
          : "bg-muted/50 text-foreground border border-border/50"
      )}>
        {isUser ? <User className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-lg px-4 py-3 max-w-[85%]",
          isUser
            ? "bg-foreground text-background"
            : "bg-card border border-border/50"
        )}>
          {isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-xs leading-relaxed font-sans">{content}</p>
          ) : (
            <ResponseCard content={content} citations={citations} onCitationClick={onCitationClick} />
          )}
        </div>

        {timestamp && !isLoading && (
          <p className="mt-1.5 text-[10px] text-muted-foreground font-mono">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
};
