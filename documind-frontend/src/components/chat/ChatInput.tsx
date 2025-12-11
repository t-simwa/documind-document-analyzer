import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  disabled,
  placeholder = "Ask a question...",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestions = ["Summarize", "Key points", "Find clauses"];

  return (
    <div className="space-y-2">
      {/* Suggestions */}
      {!message && (
        <div className="flex gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => setMessage(s)}
              className="px-2.5 py-1 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 p-2 rounded-md border border-border bg-card transition-colors",
          "focus-within:border-muted-foreground"
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 min-h-[32px] max-h-[120px] px-2 py-1.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />

        <Button
          type="submit"
          size="icon-sm"
          disabled={!message.trim() || disabled}
          className={cn("flex-shrink-0", !message.trim() && "opacity-50")}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      <p className="text-[10px] text-center text-muted-foreground">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
};
