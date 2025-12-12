import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, ArrowRight, Loader2, File, AlertCircle } from "lucide-react";
import { ProjectSelector } from "@/components/projects/ProjectSelector";

interface UploadZoneProps {
  onUpload: (files: File[], projectId?: string | null) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

const getFileTypeIcon = (filename: string) => {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-400" />;
    case 'docx':
    case 'doc':
      return <FileText className="h-4 w-4 text-blue-400" />;
    default:
      return <File className="h-4 w-4 text-muted-foreground" />;
  }
};

export const UploadZone = ({ onUpload, isUploading, uploadProgress }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  const validateFiles = (files: File[]) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
    const maxSize = 20 * 1024 * 1024;
    
    for (const file of files) {
      if (!validTypes.includes(file.type) && !file.name.endsWith('.md')) {
        setError(`"${file.name}" is not supported`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" exceeds 20MB limit`);
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (validateFiles(files)) {
      setSelectedFiles(files);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (validateFiles(files)) {
        setSelectedFiles(files);
      }
    }
  }, []);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onUpload(selectedFiles, projectId);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative border border-dashed rounded-md p-8 transition-all duration-150 text-center cursor-pointer",
          isDragging
            ? "border-foreground bg-secondary"
            : "border-border hover:border-muted-foreground"
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-md flex items-center justify-center transition-colors",
            isDragging ? "bg-foreground text-background" : "bg-secondary"
          )}>
            <Upload className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm text-foreground">
              {isDragging ? "Drop here" : "Drag & drop or click"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, TXT, MD · Max 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 animate-in">
          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Project Selection */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2 animate-in">
          <div className="space-y-2">
            <Label>Project (Optional)</Label>
            <ProjectSelector
              value={projectId}
              onChange={setProjectId}
              placeholder="Select a project (optional)"
            />
          </div>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2 animate-in">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-md border border-border bg-card group"
            >
              <div className="w-8 h-8 rounded flex items-center justify-center bg-secondary">
                {getFileTypeIcon(file.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(index)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Progress */}
          {isUploading && (
            <div className="p-3 rounded-md border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-foreground">Uploading...</span>
                </div>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <div className="h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-foreground transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full mt-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Upload
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
