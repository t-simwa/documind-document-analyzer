import { cn } from "@/lib/utils";
import { User, FileText, ExternalLink, Copy, Check, ThumbsUp, ThumbsDown, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { QueryStatus } from "@/types/api";

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
  status?: QueryStatus;
  onCitationClick?: (citation: Citation) => void;
}

const ResponseCard = ({ content, citations, onCitationClick }: { content: string; citations?: Citation[]; onCitationClick?: (citation: Citation) => void }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to render text with styled superscript citations
  const renderTextWithCitations = (text: string) => {
    // Match superscript citations (⁰¹²³⁴⁵⁶⁷⁸⁹)
    const superscriptRegex = /([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = superscriptRegex.exec(text)) !== null) {
      // Add text before citation
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add styled citation
      parts.push(
        <sup
          key={`citation-${match.index}`}
          className="text-[0.7em] text-[#737373] dark:text-[#a3a3a3] font-medium align-baseline"
        >
          {match[0]}
        </sup>
      );
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : [text];
  };

  // Format content for better display - only headers in bold, clean formatting
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const prevLine = i > 0 ? lines[i - 1].trim() : '';
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';

      // Check if it's a header
      // Headers are typically:
      // - Lines ending with colons (section headers) - even if they start with •
      // - Short lines that are title case and don't start with bullets/numbers
      // - Lines that are followed by lists or content sections
      const endsWithColon = trimmed.endsWith(':');
      
      // Section headers that start with bullet but end with colon should be treated as headers
      // Example: "• Principal Member Details:" -> "Principal Member Details:" (header)
      let headerText = trimmed;
      if (trimmed.startsWith('•') && endsWithColon) {
        headerText = trimmed.replace(/^•\s*/, '').trim();
      }
      
      const isShortTitleCase = headerText.length > 0 && 
                               headerText.length < 100 && 
                               !headerText.includes('.') && 
                               !headerText.includes('!') &&
                               !headerText.includes('?') &&
                               !headerText.match(/^\d+\./) &&
                               (headerText[0] === headerText[0].toUpperCase());
      
      // Section headers typically end with colons and are followed by content or lists
      const isSectionHeader = endsWithColon && 
                             headerText.length < 80 &&
                             !headerText.match(/^\d+\./) &&
                             (nextLine.startsWith('•') || nextLine === '' || nextLine.match(/^\d+\./) || nextLine.trim().length === 0);
      
      const isHeader = isSectionHeader || (isShortTitleCase && (prevLine === '' || prevLine.endsWith('.')));

      if (isHeader) {
        // Flush current paragraph and list
        if (currentParagraph.length > 0) {
          elements.push(
            <div key={`para-${i}`} className="mb-2.5 text-[#171717] dark:text-[#fafafa] leading-relaxed text-xs">
              {renderTextWithCitations(currentParagraph.join(' '))}
            </div>
          );
          currentParagraph = [];
        }
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-group-${i}`} className="ml-4 mb-3 space-y-1">
              {listItems.map((item, idx) => (
                <div key={idx} className="text-[#171717] dark:text-[#fafafa] leading-relaxed text-xs">
                  {renderTextWithCitations(item)}
                </div>
              ))}
            </div>
          );
          listItems = [];
        }
        // Add header (only bold element)
        // Use headerText if we extracted it from a bullet point, otherwise use trimmed
        const displayHeaderText = trimmed.startsWith('•') && trimmed.endsWith(':') 
          ? trimmed.replace(/^•\s*/, '').trim() 
          : trimmed;
        elements.push(
        <div key={`header-${i}`} className="font-medium text-[#171717] dark:text-[#fafafa] mb-1.5 mt-3 first:mt-0 text-xs">
            {displayHeaderText}
          </div>
        );
      } else if (trimmed.startsWith('•') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
        // Check if this is a section header with description (e.g., "• Section Name: description")
        const colonIndex = trimmed.indexOf(':');
        const hasColon = colonIndex > -1;
        const beforeColon = trimmed.substring(0, colonIndex).trim();
        const afterColon = trimmed.substring(colonIndex + 1).trim();
        
        // If it starts with bullet, has a colon, and the part before colon looks like a header
        // Section headers typically:
        // - Have multiple words before the colon (like "Principal Member Details")
        // - Have substantial descriptive text after the colon (more than just a value)
        // - Are followed by more list items or content
        const beforeColonWords = beforeColon.replace(/^[•*]\s*/, '').split(/\s+/).length;
        const looksLikeSectionHeader = hasColon && 
                                      beforeColon.length < 60 &&
                                      beforeColon.match(/^[•*]\s*[A-Z]/) &&
                                      beforeColonWords >= 2 && // At least 2 words (like "Principal Member")
                                      afterColon.length > 15 && // Has substantial content after colon
                                      (afterColon.match(/^[A-Z]/) || afterColon.includes('section') || afterColon.includes('This')); // Starts with capital or contains descriptive words
        
        if (looksLikeSectionHeader) {
          // Flush current paragraph and list
          if (currentParagraph.length > 0) {
            elements.push(
              <div key={`para-${i}-pre`} className="mb-3 text-foreground/90 leading-relaxed">
                {renderTextWithCitations(currentParagraph.join(' '))}
              </div>
            );
            currentParagraph = [];
          }
          if (listItems.length > 0) {
            elements.push(
              <div key={`list-group-${i}-pre`} className="ml-4 mb-3 space-y-1">
                {listItems.map((item, idx) => (
                  <div key={idx} className="text-foreground/90 leading-relaxed">
                    {renderTextWithCitations(item)}
                  </div>
                ))}
              </div>
            );
            listItems = [];
          }
          
          // Extract header text (remove bullet)
          const headerText = beforeColon.replace(/^[•*]\s*/, '').trim();
          
          // Add header
          elements.push(
            <div key={`header-${i}`} className="font-medium text-[#171717] dark:text-[#fafafa] mb-1.5 mt-3 first:mt-0 text-xs">
              {headerText}
            </div>
          );
          
          // Add description as paragraph
          if (afterColon) {
            currentParagraph.push(afterColon);
          }
        } else if (!trimmed.endsWith(':')) {
          // Regular list item (not a section header)
          // Flush current paragraph
          if (currentParagraph.length > 0) {
            elements.push(
              <div key={`para-${i}`} className="mb-3 text-foreground/90 leading-relaxed">
                {renderTextWithCitations(currentParagraph.join(' '))}
              </div>
            );
            currentParagraph = [];
          }
          // Format list items - handle numbered items with quotes
          let formattedItem = trimmed;
          // Convert asterisk to bullet if needed
          if (trimmed.startsWith('*')) {
            formattedItem = trimmed.replace(/^\*\s+/, '• ');
          }
          // Convert "• Number - Content" to "Number. Content" for better readability
          if (formattedItem.match(/^•\s*\d+\s*-\s*/)) {
            formattedItem = formattedItem.replace(/^•\s*(\d+)\s*-\s*/, '$1. ');
          }
          // Accumulate list items
          listItems.push(formattedItem);
        } else {
          // Line ends with colon but doesn't match section header pattern - treat as regular text
          currentParagraph.push(trimmed);
        }
      } else if (trimmed) {
        // Flush list if we have accumulated items
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-group-${i}`} className="ml-4 mb-3 space-y-1">
              {listItems.map((item, idx) => (
                <div key={idx} className="text-[#171717] dark:text-[#fafafa] leading-relaxed text-xs">
                  {renderTextWithCitations(item)}
                </div>
              ))}
            </div>
          );
          listItems = [];
        }
        // Regular text - accumulate into paragraph
        currentParagraph.push(trimmed);
      } else {
        // Empty line - flush paragraph and list
        if (currentParagraph.length > 0) {
          elements.push(
            <div key={`para-${i}`} className="mb-2.5 text-[#171717] dark:text-[#fafafa] leading-relaxed text-xs">
              {renderTextWithCitations(currentParagraph.join(' '))}
            </div>
          );
          currentParagraph = [];
        }
        if (listItems.length > 0) {
          elements.push(
            <div key={`list-group-${i}`} className="ml-4 mb-3 space-y-1">
              {listItems.map((item, idx) => (
                <div key={idx} className="text-[#171717] dark:text-[#fafafa] leading-relaxed text-xs">
                  {renderTextWithCitations(item)}
                </div>
              ))}
            </div>
          );
          listItems = [];
        }
      }
    }

    // Flush remaining paragraph and list
    if (currentParagraph.length > 0) {
      elements.push(
        <div key="para-final" className="mb-3 text-foreground/90 leading-relaxed">
          {renderTextWithCitations(currentParagraph.join(' '))}
        </div>
      );
    }
    if (listItems.length > 0) {
      elements.push(
        <div key="list-group-final" className="ml-4 mb-3 space-y-1">
          {listItems.map((item, idx) => (
            <div key={idx} className="text-foreground/90 leading-relaxed">
              {renderTextWithCitations(item)}
            </div>
          ))}
        </div>
      );
    }

    return elements.length > 0 ? elements : [<div key="empty">{text}</div>];
  };

  return (
    <div className="space-y-3">
      <div className="text-xs leading-relaxed font-sans">
        {formatContent(content)}
      </div>

      {citations && citations.length > 0 && (
        <div className="pt-2.5 border-t border-[#e5e5e5] dark:border-[#262626]">
          <button
            onClick={() => setSourcesExpanded(!sourcesExpanded)}
            className="w-full flex items-center justify-between mb-2 group hover:opacity-80 transition-opacity"
          >
            <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3] uppercase tracking-wide">
              Sources
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                {citations.length}
              </span>
              {sourcesExpanded ? (
                <ChevronUp className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
              ) : (
                <ChevronDown className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3]" />
              )}
            </div>
          </button>
          {sourcesExpanded && (
            <div className="space-y-1">
              {citations.map((citation, index) => (
                <button
                  key={index}
                  onClick={() => onCitationClick?.(citation)}
                  className="w-full flex items-center gap-2 p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all text-left group cursor-pointer"
                >
                  <div className="flex-shrink-0 w-4 h-4 rounded bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                    <FileText className="h-2.5 w-2.5 text-[#737373] dark:text-[#a3a3a3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate">{citation.text}</p>
                    {(citation.page || citation.section) && (
                      <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] font-mono mt-0.5">
                        {citation.page && `Page ${citation.page}`}
                        {citation.page && citation.section && " · "}
                        {citation.section}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="h-3 w-3 text-[#737373] dark:text-[#a3a3a3] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-0.5 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFeedback('up')}
          className={cn(
            "h-6 w-6 p-0",
            feedback === 'up' 
              ? "text-[#171717] dark:text-[#fafafa] bg-[#fafafa] dark:bg-[#0a0a0a]" 
              : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          )}
        >
          <ThumbsUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFeedback('down')}
          className={cn(
            "h-6 w-6 p-0",
            feedback === 'down' 
              ? "text-[#171717] dark:text-[#fafafa] bg-[#fafafa] dark:bg-[#0a0a0a]" 
              : "text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
          )}
        >
          <ThumbsDown className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 py-1">
    <div className="w-1.5 h-1.5 rounded-full bg-[#737373]/40 dark:bg-[#a3a3a3]/40 animate-pulse" style={{ animationDelay: '0ms' }} />
    <div className="w-1.5 h-1.5 rounded-full bg-[#737373]/40 dark:bg-[#a3a3a3]/40 animate-pulse" style={{ animationDelay: '150ms' }} />
    <div className="w-1.5 h-1.5 rounded-full bg-[#737373]/40 dark:bg-[#a3a3a3]/40 animate-pulse" style={{ animationDelay: '300ms' }} />
  </div>
);

export const ChatMessage = ({
  role,
  content,
  citations,
  isLoading,
  timestamp,
  status,
  onCitationClick,
}: ChatMessageProps) => {
  const isUser = role === "user";

  return (
    <div className={cn("flex gap-2.5", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-medium",
        isUser 
          ? "bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717]" 
          : "bg-[#f5f5f5] dark:bg-[#262626] text-[#171717] dark:text-[#fafafa] border border-[#e5e5e5] dark:border-[#262626]"
      )}>
        {isUser ? <User className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0", isUser && "flex flex-col items-end")}>
        <div className={cn(
          "rounded-md px-3 py-2 max-w-[85%]",
          isUser
            ? "bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717]"
            : "bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626]"
        )}>
          {isLoading ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="text-xs leading-relaxed">{content}</p>
          ) : (
            <ResponseCard content={content} citations={citations} onCitationClick={onCitationClick} />
          )}
        </div>

        {timestamp && !isLoading && (
          <p className="mt-1 text-[10px] text-[#737373] dark:text-[#a3a3a3] font-mono">
            {timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>
    </div>
  );
};
