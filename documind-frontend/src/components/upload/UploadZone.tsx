import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, FileText, X, ArrowRight, Loader2, File, AlertCircle, HardDrive, Cloud } from "lucide-react";
import { ProjectSelector } from "@/components/projects/ProjectSelector";
import { CloudFilePicker } from "@/components/cloud-storage/CloudFilePicker";
import { cloudStorageApi, type CloudStorageConnection } from "@/services/cloudStorageApi";

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
  const [connections, setConnections] = useState<CloudStorageConnection[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await cloudStorageApi.listConnections();
      setConnections(conns);
    } catch (error) {
      console.error("Failed to load connections:", error);
    }
  };

  const handleCloudFileSelect = (file: any) => {
    // File import is handled by CloudFilePicker component
    // This callback can be used for additional actions if needed
  };

  const handleDeviceUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleProviderClick = (providerId: string) => {
    const connection = connections.find((c) => c.provider === providerId && c.is_active);
    if (connection) {
      setSelectedProvider(providerId);
      setPickerOpen(true);
    } else {
      // Initiate OAuth connection
      handleConnect(providerId);
    }
  };

  const handleConnect = async (provider: string) => {
    try {
      const origin = window.location.origin.replace('127.0.0.1', 'localhost');
      const redirectUri = `${origin}/auth/${provider}/callback`;
      const { authorization_url, state } = await cloudStorageApi.initiateOAuth(provider, redirectUri);
      
      sessionStorage.setItem(`oauth_state_${provider}`, state);
      sessionStorage.setItem(`oauth_provider_${provider}`, provider);
      
      window.location.href = authorization_url;
    } catch (error) {
      console.error("Failed to initiate OAuth:", error);
      setError(`Failed to connect to ${provider}`);
    }
  };

  const getConnection = (provider: string) => {
    return connections.find((c) => c.provider === provider && c.is_active);
  };

  const UPLOAD_OPTIONS = [
    {
      id: "device",
      name: "Upload from Device",
      description: "PDF, DOCX, TXT, MD · Max 20MB",
      icon: HardDrive,
      color: "#171717",
      action: handleDeviceUploadClick,
    },
    {
      id: "google_drive",
      name: "Google Drive",
      description: "Import from your Google Drive",
      icon: Cloud,
      color: "#4285F4",
      logoUrl: "/cloud-storage/google-drive.png",
      action: () => handleProviderClick("google_drive"),
    },
    {
      id: "onedrive",
      name: "OneDrive",
      description: "Import from your OneDrive",
      icon: Cloud,
      color: "#0078D4",
      logoUrl: "/cloud-storage/one-drive.jpg",
      action: () => handleProviderClick("onedrive"),
    },
    {
      id: "box",
      name: "Box",
      description: "Import from your Box account",
      icon: Cloud,
      color: "#0061D5",
      logoUrl: "/cloud-storage/box.svg",
      action: () => handleProviderClick("box"),
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      description: "Import from SharePoint",
      icon: Cloud,
      color: "#0078D4",
      logoUrl: "/cloud-storage/sharepoint.png",
      action: () => handleProviderClick("sharepoint"),
    },
  ];

  // Global drag handler to prevent browser's default drag behavior
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto animate-in">
      {/* Hidden file input for device upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {UPLOAD_OPTIONS.map((option) => {
          const Icon = option.icon;
          const connection = option.id !== "device" ? getConnection(option.id) : null;
          const isConnected = !!connection;

          return (
            <div
              key={option.id}
              onDragEnter={option.id === "device" ? handleDrag : undefined}
              onDragLeave={option.id === "device" ? handleDrag : undefined}
              onDragOver={option.id === "device" ? handleDrag : undefined}
              onDrop={option.id === "device" ? handleDrop : undefined}
              onClick={option.action}
              className={cn(
                "group relative border rounded-lg p-4 transition-all duration-200 cursor-pointer",
                "hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]",
                "hover:shadow-sm dark:hover:shadow-[0_1px_2px_0_rgba(0,0,0,0.3)]",
                "active:scale-[0.98]",
                isDragging && option.id === "device"
                  ? "border-[#171717] dark:border-[#fafafa] bg-[#fafafa] dark:bg-[#0a0a0a] scale-[1.02]"
                  : "border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200",
                  "group-hover:scale-110 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#404040]",
                  option.id === "device"
                    ? isDragging
                      ? "bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717]"
                      : "bg-[#f5f5f5] dark:bg-[#262626] text-[#171717] dark:text-[#fafafa]"
                    : "bg-[#f5f5f5] dark:bg-[#262626]"
                )}>
                  {option.logoUrl ? (
                    <div className="w-6 h-6 flex items-center justify-center overflow-hidden rounded-sm">
                      <img
                        src={option.logoUrl}
                        alt={option.name}
                        className="w-6 h-6 object-contain"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-icon')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-medium text-white';
                            fallback.style.backgroundColor = option.color;
                            fallback.textContent = option.name.split(' ').map(n => n[0]).join('');
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] transition-colors duration-200 group-hover:text-[#000000] dark:group-hover:text-[#ffffff]">
                      {option.name}
                    </h3>
                    {isConnected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 transition-all duration-200 group-hover:scale-125 group-hover:shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                    )}
                  </div>
                  <p className="text-[10px] text-[#525252] dark:text-[#a3a3a3] line-clamp-2 transition-colors duration-200 group-hover:text-[#171717] dark:group-hover:text-[#d4d4d4]">
                    {option.description}
                  </p>
                  {isConnected && connection?.account_email && (
                    <p className="text-[10px] text-[#525252] dark:text-[#a3a3a3] mt-1 truncate transition-colors duration-200 group-hover:text-[#171717] dark:group-hover:text-[#d4d4d4]">
                      {connection.account_email.split("@")[0]}
                    </p>
                  )}
                </div>
              </div>

              {/* Hover indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5">
                <div className="w-7 h-7 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#404040] transition-colors duration-200">
                  <ArrowRight className="h-3.5 w-3.5 text-[#171717] dark:text-[#fafafa] transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 flex items-center gap-2 animate-in">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Selected Files & Project Selection */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 space-y-4 animate-in border-t border-[#e5e5e5] dark:border-[#262626] pt-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label className="text-sm text-[#171717] dark:text-[#fafafa]">Project (Optional)</Label>
            <ProjectSelector
              value={projectId}
              onChange={setProjectId}
              placeholder="Select a project (optional)"
            />
          </div>

          {/* Selected Files List */}
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] group hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] hover:border-[#d4d4d4] dark:hover:border-[#404040] transition-all duration-200 cursor-pointer"
              >
                <div className="w-8 h-8 rounded flex items-center justify-center bg-[#f5f5f5] dark:bg-[#262626] transition-all duration-200 group-hover:scale-110 group-hover:bg-[#e5e5e5] dark:group-hover:bg-[#404040]">
                  {getFileTypeIcon(file.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#171717] dark:text-[#fafafa] truncate transition-colors duration-200 group-hover:text-[#000000] dark:group-hover:text-[#ffffff]">{file.name}</p>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5 transition-colors duration-200 group-hover:text-[#525252] dark:group-hover:text-[#d4d4d4]">{formatFileSize(file.size)}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-[#737373] dark:text-[#a3a3a3] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 hover:scale-110 rounded-md"
                >
                  <X className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
                </Button>
              </div>
            ))}

            {/* Progress */}
            {isUploading && (
              <div className="p-3 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
                    <span className="text-sm text-[#171717] dark:text-[#fafafa]">Uploading...</span>
                  </div>
                  <span className="text-sm text-[#737373] dark:text-[#a3a3a3]">{uploadProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#f5f5f5] dark:bg-[#262626] overflow-hidden">
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
              className="group w-full h-9 text-sm font-medium bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] transition-all duration-200 hover:shadow-md dark:hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  Upload {selectedFiles.length > 1 ? `${selectedFiles.length} files` : "file"}
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Cloud File Picker Dialog */}
      {selectedProvider && (
        <CloudFilePicker
          provider={selectedProvider}
          open={pickerOpen}
          onOpenChange={(open) => {
            setPickerOpen(open);
            if (!open) {
              setSelectedProvider(null);
            }
          }}
          onSelectFile={handleCloudFileSelect}
          projectId={projectId}
        />
      )}
    </div>
  );
};
