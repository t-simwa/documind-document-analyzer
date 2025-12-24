import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, File, Folder, ArrowLeft, Check } from "lucide-react";
import { cloudStorageApi, type CloudFile, type CloudFileListResponse } from "@/services/cloudStorageApi";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/utils";

interface CloudFilePickerProps {
  provider: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFile: (file: CloudFile) => void;
  projectId?: string | null;
}

export const CloudFilePicker = ({ provider, open, onOpenChange, onSelectFile, projectId }: CloudFilePickerProps) => {
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [folderStack, setFolderStack] = useState<string[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadFiles();
    } else {
      // Reset state when dialog closes
      setFiles([]);
      setFolderId(undefined);
      setFolderStack([]);
      setNextPageToken(undefined);
      setSelectedFile(null);
    }
  }, [open, folderId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response: CloudFileListResponse = await cloudStorageApi.listFiles(provider, folderId, nextPageToken);
      setFiles(response.files);
      setNextPageToken(response.next_page_token);
    } catch (error) {
      console.error("Failed to load files:", error);
      toast.error("Failed to load files from cloud storage");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (file: CloudFile) => {
    if (file.is_folder) {
      setFolderStack([...folderStack, folderId || ""]);
      setFolderId(file.id);
      setNextPageToken(undefined);
    }
  };

  const handleBack = () => {
    const newStack = [...folderStack];
    const parentId = newStack.pop();
    setFolderStack(newStack);
    setFolderId(parentId);
    setNextPageToken(undefined);
  };

  const handleImport = async (file: CloudFile) => {
    try {
      setImporting(file.id);
      await cloudStorageApi.importFile(provider, file.id, projectId || undefined);
      toast.success(`Importing ${file.name}...`);
      onOpenChange(false);
      onSelectFile(file);
    } catch (error) {
      console.error("Failed to import file:", error);
      toast.error("Failed to import file");
    } finally {
      setImporting(null);
    }
  };

  const getFileIcon = (file: CloudFile) => {
    if (file.is_folder) {
      return <Folder className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />;
    }
    return <File className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />;
  };

  const providerName = provider.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[75vh] flex flex-col">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-sm">Select File from {providerName}</DialogTitle>
          <DialogDescription className="text-[10px]">Browse and select a file to import</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {folderStack.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-full justify-start h-7 text-[10px] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa]"
            >
              <ArrowLeft className="h-3 w-3 mr-1.5" />
              Back
            </Button>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
              No files found
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors group",
                  selectedFile === file.id
                    ? "border-[#171717] dark:border-[#fafafa] bg-[#f5f5f5] dark:bg-[#262626]"
                    : "border-[#e5e5e5] dark:border-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]"
                )}
                onClick={() => {
                  if (file.is_folder) {
                    handleFolderClick(file);
                  } else {
                    setSelectedFile(file.id);
                  }
                }}
              >
                <div className="flex-shrink-0">{getFileIcon(file)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-[#171717] dark:text-[#fafafa] truncate">{file.name}</p>
                  {!file.is_folder && (
                    <p className="text-[9px] text-[#737373] dark:text-[#a3a3a3]">{formatFileSize(file.size)}</p>
                  )}
                </div>
                {!file.is_folder && selectedFile === file.id && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleImport(file);
                    }}
                    disabled={importing === file.id}
                    className="h-6 px-2 text-[9px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] flex-shrink-0"
                  >
                    {importing === file.id ? (
                      <>
                        <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Check className="h-2.5 w-2.5 mr-1" />
                        Import
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))
          )}

          {nextPageToken && (
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              className="w-full h-7 text-[10px] border-[#e5e5e5] dark:border-[#262626]"
            >
              Load More
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

