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
      return <FileText className="h-3.5 w-3.5 text-red-500" />;
    case 'docx':
    case 'doc':
      return <FileText className="h-3.5 w-3.5 text-blue-500" />;
    default:
      return <File className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />;
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
          "relative border border-dashed rounded-md p-6 transition-all duration-150 text-center cursor-pointer",
          isDragging
            ? "border-[#171717] dark:border-[#fafafa] bg-[#fafafa] dark:bg-[#0a0a0a]"
            : "border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]"
        )}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-2.5">
          <div className={cn(
            "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
            isDragging ? "bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717]" : "bg-[#f5f5f5] dark:bg-[#262626]"
          )}>
            <Upload className="h-4 w-4" />
          </div>

          <div>
            <p className="text-xs text-[#171717] dark:text-[#fafafa]">
              {isDragging ? "Drop here" : "Drag & drop or click"}
            </p>
            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] mt-1">
              PDF, DOCX, TXT, MD · Max 20MB
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 p-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center gap-2 animate-in">
          <AlertCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
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
              className="flex items-center gap-2.5 p-2 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] group"
            >
              <div className="w-7 h-7 rounded flex items-center justify-center bg-[#f5f5f5] dark:bg-[#262626]">
                {getFileTypeIcon(file.name)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#171717] dark:text-[#fafafa] truncate">{file.name}</p>
                <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">{formatFileSize(file.size)}</p>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#737373] dark:text-[#a3a3a3] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Progress */}
          {isUploading && (
            <div className="p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
                  <span className="text-xs text-[#171717] dark:text-[#fafafa]">Uploading...</span>
                </div>
                <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">{uploadProgress}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#f5f5f5] dark:bg-[#262626] overflow-hidden">
                <div
                  className="h-full bg-[#171717] dark:bg-[#fafafa] transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full mt-2 h-8 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                Upload
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
