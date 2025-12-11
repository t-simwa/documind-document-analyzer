import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className, showText = true }: LogoProps) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* Vercel-inspired triangle logo */}
      <div className="relative w-6 h-6">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path 
            d="M12 2L2 19.5h20L12 2z" 
            className="fill-foreground"
          />
        </svg>
      </div>
      {showText && (
        <span className="text-sm font-semibold text-foreground tracking-tight">DocAnalyzer</span>
      )}
    </div>
  );
};
