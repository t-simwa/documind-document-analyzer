// Custom professional icons for security scanning - Unique designs for world-class SaaS platform
import { cn } from "@/lib/utils";

export const SecurityCleanIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 3L4 6v4c0 4.5 3 8.5 6 9.5 3-1 6-5 6-9.5V6l-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="m7 10 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SecurityThreatIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 3L4 6v4c0 4.5 3 8.5 6 9.5 3-1 6-5 6-9.5V6l-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 7v3M10 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SecurityScanningIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={cn("animate-spin", className)}>
    <path d="M10 3L4 6v4c0 4.5 3 8.5 6 9.5 3-1 6-5 6-9.5V6l-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3"/>
    <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="2 4" opacity="0.7"/>
  </svg>
);

export const SecurityErrorIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 6v4M10 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

export const SecurityPendingIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 3L4 6v4c0 4.5 3 8.5 6 9.5 3-1 6-5 6-9.5V6l-6-3z" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"/>
  </svg>
);

export const MalwareIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="4" y="4" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M7 7h6v6H7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 8h4v4H8z" fill="currentColor" opacity="0.2"/>
    <path d="M9 9h2v2H9z" fill="currentColor" opacity="0.4"/>
  </svg>
);

export const VirusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="10" cy="10" r="2.5" fill="currentColor" opacity="0.3"/>
    <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.5 5.5l1.5 1.5M13 13l1.5 1.5M14.5 5.5L13 7M7 13l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

export const ThreatAlertIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 3l6 4v5c0 3-2 5.5-6 6.5-4-1-6-3.5-6-6.5V7l6-4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M10 8v3M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

