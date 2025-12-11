import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(187, 94%, 43%)" />
            <stop offset="100%" stopColor="hsl(199, 89%, 48%)" />
          </linearGradient>
        </defs>
        <rect x="4" y="6" width="24" height="30" rx="3" stroke="url(#logoGradient)" strokeWidth="2.5" fill="none" />
        <path d="M10 14h12M10 20h12M10 26h8" stroke="url(#logoGradient)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="30" r="8" fill="url(#logoGradient)" />
        <path d="M27 30h6M30 27v6" stroke="hsl(222, 47%, 5%)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
};
