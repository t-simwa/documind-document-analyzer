# DocuMind AI Font Usage Guide - IBM Plex Type Scale

## Overview

DocuMind AI uses the **IBM Plex** font family to create a professional, enterprise-grade typography system. The power of Plex lies in using the **entire family**, not just one style.

## Font Families

### 1. IBM Plex Sans (Primary - 90% of UI)
**Usage:** Main UI, body text, navigation, chat bubbles, settings, buttons, labels

**Weights:**
- `400` (Regular) - Body text, paragraphs, UI elements
- `500` (Medium) - Emphasis, buttons, labels

**When to use:**
- All navigation elements
- Chat interface and messages
- Settings and configuration panels
- Form inputs and labels
- Buttons and interactive elements
- General content and descriptions

**Example:**
```tsx
// Default - uses IBM Plex Sans automatically
<p>This is body text</p>

// Explicitly use sans
<div className="font-sans">Navigation menu</div>
```

---

### 2. IBM Plex Mono (Data & Code)
**Usage:** Extracted data, numbers, tables, JSON snippets, contract clauses, confidence scores, security codes, financial data

**Weights:**
- `400` (Regular) - Standard data display
- `500` (Medium) - Emphasized data

**When to use:**
- **Tables** - All table data
- **JSON snippets** - API responses, data structures
- **Contract clauses** - Extracted legal text
- **Confidence scores** - AI confidence percentages
- **Security codes** - API keys, tokens, IDs
- **Financial data** - Amounts, percentages, numbers
- **Extracted data** - Any AI-extracted content

**CSS Classes:**
- `.font-mono` - Standard Tailwind class
- `.data-mono` - Custom class for extracted data
- `.financial-data` - Financial information
- `.security-code` - Security codes and tokens
- `.confidence-score` - AI confidence scores
- `.extracted-data` - General extracted content

**Example:**
```tsx
// Table data
<td className="font-mono">$1,234.56</td>

// Confidence score
<span className="font-mono confidence-score">95.2%</span>

// JSON snippet
<pre className="font-mono text-sm">{jsonData}</pre>

// Security code
<code className="font-mono security-code">API_KEY_12345</code>
```

**The "Zero" Trick:**
IBM Plex Mono has a slashed/dotted zero which prevents errors—a critical detail that security-conscious clients notice. Always use Mono for any data that could be misread.

---

### 3. IBM Plex Serif (Sparingly - Citations & Headlines)
**Usage:** High-level headers, citations, executive summaries, legal/official content

**Weights:**
- `400` (Regular) - Standard serif text
- `500` (Medium) - Emphasized serif text

**When to use:**
- **Executive Summary** headers
- **Citations** - Legal citations, references
- **High-level headers** - Important page titles
- **Legal/Official content** - Content that needs authority

**CSS Classes:**
- `.font-serif` - Standard Tailwind class
- `.citation` - Citations and references
- `.executive-summary` - Executive summary headers
- `.legal-header` - Legal document headers

**Example:**
```tsx
// Executive summary header
<h1 className="font-serif executive-summary">Executive Summary</h1>

// Citation
<cite className="font-serif citation">Smith v. Jones, 2024</cite>

// Legal header
<h2 className="font-serif legal-header">Terms and Conditions</h2>
```

**⚠️ Important:** Use Serif **sparingly**. It adds authority but can feel heavy if overused. Reserve it for content that needs that "Legal/Official" feel.

---

## Typography Guidelines

### Letter Spacing

**Headings:**
- Use `tracking-tight` or `letter-spacing-tight-heading` (-0.02em) for main headings
- Use `letter-spacing-tight-subheading` (-0.01em) for subheadings

**Body Text:**
- Default letter spacing for body text
- Don't tighten letter spacing for body text (hurts readability)

**Example:**
```tsx
<h1 className="tracking-tight">Main Heading</h1>
<h2 className="tracking-tight-subheading">Subheading</h2>
<p>Body text uses default spacing</p>
```

### Font Weights

**Avoid:**
- ❌ `300` (Light) - Too thin for body text, hard to read on complex dashboards

**Use:**
- ✅ `400` (Regular) - Body text, standard UI elements
- ✅ `500` (Medium) - Emphasis, buttons, labels

### Font Sizes

Follow standard Tailwind typography scale:
- Headings: `text-4xl`, `text-5xl`, `text-6xl` (with tight tracking)
- Body: `text-base` (16px), `text-lg` (18px)
- Small: `text-sm` (14px), `text-xs` (12px)

---

## Implementation Examples

### Chat Interface
```tsx
// User message (Sans)
<div className="font-sans">{userMessage}</div>

// AI response with confidence score (Mono)
<div>
  <p className="font-sans">{response}</p>
  <span className="font-mono confidence-score">Confidence: 92.5%</span>
</div>
```

### Data Table
```tsx
<table>
  <tbody>
    <tr>
      <td className="font-sans">Document Name</td>
      <td className="font-mono">$1,234.56</td> {/* Financial data */}
      <td className="font-mono">95.2%</td> {/* Confidence */}
    </tr>
  </tbody>
</table>
```

### JSON Display
```tsx
<pre className="font-mono text-sm bg-muted p-4 rounded">
  {JSON.stringify(data, null, 2)}
</pre>
```

### Citation
```tsx
<blockquote>
  <p className="font-sans">The extracted clause states...</p>
  <cite className="font-serif citation">Section 3.2, Contract ABC-123</cite>
</blockquote>
```

---

## Quick Reference

| Element | Font | Weight | Letter Spacing |
|---------|------|--------|----------------|
| Body text | Plex Sans | 400 | Default |
| Headings | Plex Sans | 500-700 | Tight (-0.02em) |
| Buttons | Plex Sans | 500 | Default |
| Tables | Plex Mono | 400 | Default |
| JSON/Code | Plex Mono | 400 | Default |
| Confidence scores | Plex Mono | 400 | Default |
| Citations | Plex Serif | 400 | Default |
| Executive Summary | Plex Serif | 500 | Default |

---

## Best Practices

1. **90% Sans Rule:** Use IBM Plex Sans for 90% of your interface
2. **Mono for Data:** Always use Mono for any extracted data, numbers, or code
3. **Serif Sparingly:** Only use Serif for citations and high-level headers that need authority
4. **Tight Headings:** Always use tight letter spacing for headings
5. **Avoid Light Weight:** Never use 300 (Light) weight for body text
6. **Consistency:** Use the same font family consistently across similar elements

---

## Migration Notes

If migrating from Geist fonts:
- Replace all `font-sans` references (already using Plex Sans by default)
- Add `font-mono` to tables, JSON, and data displays
- Add `font-serif` to citations and executive summaries
- Update heading letter spacing to use `tracking-tight`

