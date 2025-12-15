/**
 * Format LLM responses to match professional chat providers (Gemini, OpenAI, etc.)
 * Replaces citation markers with superscript numbers and properly formats markdown
 */

// Helper function to convert numbers to superscript
function toSuperscript(num: number): string {
  const superscriptMap: { [key: string]: string } = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return num.toString().split('').map(digit => superscriptMap[digit] || digit).join('');
}

export function formatResponse(text: string): string {
  if (!text) return text;

  let formatted = text;

  // FIRST: Replace citation markers with superscript numbers BEFORE processing markdown
  // Handle complex cases like [Citation: 16, Citation: 20] -> ¹⁶²⁰
  // This pattern matches: [Citation: X, Citation: Y, Citation: Z] etc.
  formatted = formatted.replace(/\[Citation:\s*\d+(?:\s*,\s*Citation:\s*\d+)*\]/gi, (match) => {
    // Extract all numbers from the match
    const numberMatches = match.match(/\d+/g);
    if (numberMatches && numberMatches.length > 0) {
      return numberMatches.map((num: string) => toSuperscript(parseInt(num))).join('');
    }
    return match;
  });
  
  // Handle single citations: [Citation: 1] -> ¹
  formatted = formatted.replace(/\[Citation:\s*(\d+)\]/gi, (match, num) => {
    return toSuperscript(parseInt(num));
  });
  
  // Handle multiple citations: [Citation: 1, 2] or [Citation: 1,2] -> ¹²
  formatted = formatted.replace(/\[Citation:\s*(\d+(?:\s*,\s*\d+)+)\]/gi, (match, nums) => {
    const numbers = nums.split(',').map((n: string) => parseInt(n.trim()));
    return numbers.map((n: number) => toSuperscript(n)).join('');
  });
  
  // Handle other citation formats
  formatted = formatted.replace(/【Citation:\s*(\d+)】/g, (match, num) => {
    return toSuperscript(parseInt(num));
  });
  formatted = formatted.replace(/【(\d+)†[^】]+】/g, (match, num) => {
    return toSuperscript(parseInt(num));
  });

  // Remove ALL ** symbols globally (most aggressive approach)
  // This ensures no ** symbols can appear in the output
  formatted = formatted.replace(/\*\*/g, '');

  // Process markdown tables - convert to readable format
  const lines = formatted.split('\n');
  const processedLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Detect markdown table (contains | characters)
    const isTableRow = trimmedLine.includes('|') && trimmedLine.split('|').length >= 3;
    const isTableSeparator = trimmedLine.match(/^\|[\s\-:|]+\|$/);

    if (isTableSeparator) {
      // Skip table separator lines
      continue;
    } else if (isTableRow) {
      // Process table row
      inTable = true;
      const cells = trimmedLine
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell.length > 0);
      
      if (cells.length > 0) {
        tableRows.push(cells);
      }
    } else {
      // Not a table row - flush table if we were in one
      if (inTable && tableRows.length > 0) {
        // Format table as readable text
        processedLines.push(''); // Empty line before table
        for (const row of tableRows) {
          if (row.length === 2) {
            // Two-column format: "Label: Value"
            processedLines.push(`• ${row[0]}: ${row[1]}`);
          } else if (row.length > 2) {
            // Multi-column: join with " - "
            processedLines.push(`• ${row.join(' - ')}`);
          } else {
            processedLines.push(`• ${row[0]}`);
          }
        }
        processedLines.push(''); // Empty line after table
        tableRows = [];
        inTable = false;
      }

      if (!trimmedLine) {
        processedLines.push('');
        continue;
      }

      // Check if this is a header (starts with #)
      // Note: Bold markdown (**) already removed, so we only check for # headers
      const isHeader = trimmedLine.match(/^#{1,6}\s+/);

      if (isHeader) {
        // Clean header: remove # symbols, keep text only
        // Note: ** symbols already removed at function start
        let headerText = trimmedLine.replace(/^#{1,6}\s+/, '').trim();
        // Remove any trailing superscript citations from headers (they should be in the content, not headers)
        headerText = headerText.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+$/, '');
        processedLines.push(headerText);
      } else {
        // Process regular text - remove ALL markdown formatting
        let processedLine = line;

        // Note: All ** symbols are already removed at the start of the function
        // No need to process bold markdown here as it's already cleaned
        
        // Clean up spacing around dashes in citations for better readability
        processedLine = processedLine.replace(/\s+-\s+(Citations?|Citation)/gi, ' — $1');

        // Remove markdown italic (*text* or _text_)
        processedLine = processedLine.replace(/\*([^*]+)\*/g, '$1');
        processedLine = processedLine.replace(/_([^_]+)_/g, '$1');

        // Remove markdown strikethrough (~~text~~)
        processedLine = processedLine.replace(/~~([^~]+)~~/g, '$1');

        // Remove markdown code blocks (```code```)
        processedLine = processedLine.replace(/```[\s\S]*?```/g, '');
        processedLine = processedLine.replace(/`([^`]+)`/g, '$1');

        // Remove markdown links [text](url) -> text
        processedLine = processedLine.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

        // Remove markdown horizontal rules (---, ***)
        processedLine = processedLine.replace(/^[-*]{3,}$/gm, '');

        // Remove em dashes and other special characters used for formatting
        processedLine = processedLine.replace(/—/g, '-');
        processedLine = processedLine.replace(/–/g, '-');

        // Clean up pipe characters that aren't part of tables (leftover from table formatting)
        processedLine = processedLine.replace(/\|\s*/g, ' ');

        // Clean up multiple spaces
        processedLine = processedLine.replace(/\s{2,}/g, ' ');

        // Convert asterisk bullets (*) to proper bullet points (•)
        if (processedLine.trim().match(/^\*\s+/)) {
          processedLine = processedLine.replace(/^(\s*)\*\s+/, '$1• ');
        }
        
        // Handle numbered lists: preserve numbered format (1., 2., etc.)
        if (processedLine.trim().match(/^\d+\.\s+/)) {
          // Already properly formatted numbered list, keep as is
          // Just ensure proper spacing
          processedLine = processedLine.replace(/^(\s*)(\d+\.)\s+/, '$1$2 ');
        } else {
          // Convert numbered list items: "• Number - Content" to "Number. Content"
          const numberedListItemMatch = processedLine.trim().match(/^[-•]\s*(\d+)\s*-\s*(.+)$/);
          if (numberedListItemMatch) {
            const number = numberedListItemMatch[1];
            const content = numberedListItemMatch[2].trim();
            // Format as "Number. Content" instead of "• Number - Content"
            processedLine = processedLine.replace(/^(\s*)[-•]\s*(\d+)\s*-\s*/, `$1$2. `);
          } else if (processedLine.trim().match(/^[-•]\s+/)) {
            // Regular bullet point
            processedLine = processedLine.replace(/^(\s*)[-•]\s+/, '$1• ');
          }
        }

        // Remove trailing punctuation that looks AI-generated
        processedLine = processedLine.replace(/\s+\.\s*$/, '.');

        processedLines.push(processedLine);
      }
    }
  }

  // Flush any remaining table
  if (inTable && tableRows.length > 0) {
    processedLines.push('');
    for (const row of tableRows) {
      if (row.length === 2) {
        processedLines.push(`• ${row[0]}: ${row[1]}`);
      } else if (row.length > 2) {
        processedLines.push(`• ${row.join(' - ')}`);
      } else {
        processedLines.push(`• ${row[0]}`);
      }
    }
    processedLines.push('');
  }

  formatted = processedLines.join('\n');

  // Final safety check: Remove ANY remaining ** symbols (shouldn't be any, but just in case)
  formatted = formatted.replace(/\*\*/g, '');

  // Remove empty lines at start and end
  formatted = formatted.replace(/^\n+|\n+$/g, '');

  // Clean up multiple consecutive empty lines (max 1)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Remove trailing spaces
  formatted = formatted.replace(/[ \t]+$/gm, '');

  return formatted.trim();
}

/**
 * Format response with proper HTML structure for rendering
 * Returns JSX-ready structure
 */
export function formatResponseForDisplay(text: string): Array<{ type: 'header' | 'text' | 'list'; content: string }> {
  const formatted = formatResponse(text);
  const lines = formatted.split('\n');
  const blocks: Array<{ type: 'header' | 'text' | 'list'; content: string }> = [];
  let currentTextBlock = '';

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      if (currentTextBlock) {
        blocks.push({ type: 'text', content: currentTextBlock.trim() });
        currentTextBlock = '';
      }
      continue;
    }

    // Check if it's a header (bold text on its own line, often followed by list)
    const isHeader = trimmed.length < 100 && 
                     (trimmed.match(/^[A-Z][^.!?]*$/) || 
                      trimmed.match(/^[A-Z][^.!?]*:$/)) &&
                     !trimmed.includes('•') &&
                     !trimmed.match(/^\d+\./);

    // Check if it's a list item
    const isListItem = trimmed.startsWith('•') || trimmed.match(/^\d+\./);

    if (isHeader) {
      if (currentTextBlock) {
        blocks.push({ type: 'text', content: currentTextBlock.trim() });
        currentTextBlock = '';
      }
      blocks.push({ type: 'header', content: trimmed });
    } else if (isListItem) {
      if (currentTextBlock && !currentTextBlock.trim().endsWith('•')) {
        blocks.push({ type: 'text', content: currentTextBlock.trim() });
        currentTextBlock = '';
      }
      if (blocks.length > 0 && blocks[blocks.length - 1].type === 'list') {
        blocks[blocks.length - 1].content += '\n' + trimmed;
      } else {
        blocks.push({ type: 'list', content: trimmed });
      }
    } else {
      currentTextBlock += (currentTextBlock ? ' ' : '') + trimmed;
    }
  }

  if (currentTextBlock) {
    blocks.push({ type: 'text', content: currentTextBlock.trim() });
  }

  return blocks;
}

