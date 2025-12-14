// Custom professional icons for processing steps - Unique designs for world-class SaaS platform
import { cn } from "@/lib/utils";

export const UploadStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M6 10h8M10 6v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M4 16h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

export const SecurityScanStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 3L4 6v4c0 4.5 3 8.5 6 9.5 3-1 6-5 6-9.5V6l-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <path d="M10 7.5v2.5l1.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const ExtractStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M5 3h8l4 4v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M13 3v4h4M6 9h8M6 12h6M6 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
  </svg>
);

export const OCRStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 8h6M7 11h4M7 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <circle cx="8" cy="6.5" r="0.75" fill="currentColor" opacity="0.4"/>
    <circle cx="12" cy="6.5" r="0.75" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const ChunkStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="11" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="4" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M6.5 6.5h7M6.5 13.5h7M6.5 6.5v7M13.5 6.5v7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3"/>
  </svg>
);

export const EmbedStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
    <path d="M10 4v2M10 14v2M4 10h2M14 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="10" cy="10" r="1" fill="currentColor" opacity="0.6"/>
  </svg>
);

export const IndexStepIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M6 6h8M6 14h8M6 6v8M14 6v8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
  </svg>
);

export const ProcessingSpinnerIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("animate-spin", className)}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 8" opacity="0.3"/>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 8" strokeDashoffset="4" opacity="0.7"/>
  </svg>
);

export const CheckCompleteIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="m7 10 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ErrorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 6v4M10 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

