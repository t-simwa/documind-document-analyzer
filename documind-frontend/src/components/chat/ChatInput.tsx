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
    <div className="px-0 py-0">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-end gap-2 p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] transition-all",
          "focus-within:border-[#171717] dark:focus-within:border-[#fafafa] focus-within:ring-1 focus-within:ring-[#171717]/5 dark:focus-within:ring-[#fafafa]/5"
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
            "flex-1 min-h-[32px] max-h-[120px] px-2 py-1.5 bg-transparent text-xs text-[#171717] dark:text-[#fafafa] placeholder:text-[#737373] dark:placeholder:text-[#a3a3a3] resize-none focus:outline-none",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
        />

        <Button
          type="submit"
          size="sm"
          disabled={!message.trim() || isLoading}
          className={cn(
            "flex-shrink-0 h-7 w-7 p-0 bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]",
            !message.trim() && "opacity-50"
          )}
        >
          <Send className="h-3 w-3" />
        </Button>
      </form>
    </div>
  );
};
