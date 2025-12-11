import { Button } from "@/components/ui/button";
import { Upload, FileText, MessageSquare, Lock } from "lucide-react";

interface EmptyStateProps {
  onUpload: () => void;
}

export const EmptyState = ({ onUpload }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 animate-in">
      <div className="max-w-sm text-center">
        {/* Icon */}
        <div className="w-12 h-12 rounded-md bg-secondary flex items-center justify-center mx-auto mb-4">
          <FileText className="h-6 w-6 text-foreground" />
        </div>

        {/* Text */}
        <h1 className="text-lg font-semibold text-foreground mb-2">
          Document Analyzer
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Upload documents and get AI-powered insights with citations.
        </p>

        {/* CTA */}
        <Button onClick={onUpload} size="lg">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>

        {/* Features */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span>PDF, DOCX, TXT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Natural language</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" />
            <span>Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};
