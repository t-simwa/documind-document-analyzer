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
}

const ResponseCard = ({ content, citations }: { content: string; citations?: Citation[] }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {content}
      </div>

      {citations && citations.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Sources
          </p>
          <div className="space-y-1">
            {citations.map((citation, index) => (
              <button
                key={index}
                className="w-full flex items-center gap-2 p-2 rounded border border-border hover:bg-secondary transition-colors text-left group"
              >
                <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{citation.text}</p>
                  {(citation.page || citation.section) && (
                    <p className="text-[10px] text-muted-foreground font-serif citation">
                      {citation.page && `Page ${citation.page}`}
                      {citation.page && citation.section && " · "}
                      {citation.section}
                    </p>
                  )}
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-0.5 pt-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setFeedback('up')}
          className={cn("h-7 w-7", feedback === 'up' ? "text-foreground" : "text-muted-foreground")}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setFeedback('down')}
          className={cn("h-7 w-7", feedback === 'down' ? "text-foreground" : "text-muted-foreground")}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1 py-2">
    <div className="typing-dot" />
    <div className="typing-dot" />
    <div className="typing-dot" />
  </div>
);

export const ChatMessage = ({
  role,
  content,
  citations,
  isLoading,
  timestamp,
}: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-3 animate-in", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-xs font-medium",
        isUser ? "bg-foreground text-background" : "bg-secondary text-foreground"
      )}>
        {isUser ? <User className="h-4 w-4" /> : "AI"}
      </div>

      {/* Content */}
      <div className={cn("flex-1 max-w-[80%]", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-md px-3 py-2",
          isUser
            ? "bg-foreground text-background"
            : "bg-card border border-border"
        )}>
          {isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-sm">{content}</p>
          ) : (
            <ResponseCard content={content} citations={citations} />
          )}
        </div>

        {timestamp && !isLoading && (
          <p className="mt-1 text-[10px] text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
};
