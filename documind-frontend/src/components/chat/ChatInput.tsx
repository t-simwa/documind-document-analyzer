import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSendMessage,
  isLoading = false,
  placeholder = "Ask a question about this document...",
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
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-6 py-4">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 p-3 rounded-lg border border-border/50 bg-card transition-all",
          "focus-within:border-border focus-within:shadow-sm"
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            "flex-1 min-h-[36px] max-h-[120px] px-2 py-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none font-sans",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isLoading}
          className={cn(
            "flex-shrink-0 h-8 w-8 p-0",
            !message.trim() && "opacity-50"
          )}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
};
