import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { CameraIcon, CloseIcon } from "./SettingsIcons";
import { userProfileApi } from "@/services/api";
import { cn } from "@/lib/utils";

interface ProfilePictureUploadProps {
  currentAvatar?: string;
  userName: string;
  onAvatarChange?: (avatarUrl: string) => void;
}

export const ProfilePictureUpload = ({
  currentAvatar,
  userName,
  onAvatarChange,
}: ProfilePictureUploadProps) => {
  const [avatar, setAvatar] = useState<string | undefined>(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const { avatarUrl } = await userProfileApi.uploadAvatar(file);
      setAvatar(avatarUrl);
      setPreview(null);
      onAvatarChange?.(avatarUrl);
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload profile picture",
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    setIsUploading(true);
    try {
      setAvatar(undefined);
      setPreview(null);
      onAvatarChange?.("");
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
    } catch (error) {
      toast({
        title: "Failed to remove",
        description: error instanceof Error ? error.message : "Failed to remove profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const displayAvatar = preview || avatar;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative group">
        <div className="relative h-36 w-36">
          {displayAvatar ? (
            <div className="relative h-36 w-36 rounded-full overflow-hidden border-2 border-[#e5e5e5] dark:border-[#262626] ring-2 ring-[#e5e5e5] dark:ring-[#262626] ring-offset-2 ring-offset-white dark:ring-offset-[#171717] transition-all duration-200 group-hover:border-[#d4d4d4] dark:group-hover:border-[#404040] group-hover:ring-[#d4d4d4] dark:group-hover:ring-[#404040]">
              <img 
                src={displayAvatar} 
                alt={userName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="relative h-36 w-36 rounded-full border-2 border-[#e5e5e5] dark:border-[#262626] ring-2 ring-[#e5e5e5] dark:ring-[#262626] ring-offset-2 ring-offset-white dark:ring-offset-[#171717] bg-gradient-to-br from-[#171717]/10 to-[#171717]/5 dark:from-[#fafafa]/10 dark:to-[#fafafa]/5 transition-all duration-200 group-hover:border-[#d4d4d4] dark:group-hover:border-[#404040] group-hover:ring-[#d4d4d4] dark:group-hover:ring-[#404040] flex items-center justify-center">
              <div className="flex flex-col items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-[#737373] dark:text-[#a3a3a3]">
                  <rect x="4" y="6" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M4 8h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
                </svg>
              </div>
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-[#171717]/90 rounded-full backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={cn(
              "h-9 px-4 text-[13px] font-medium",
              "bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626]",
              "text-[#171717] dark:text-[#fafafa]",
              "hover:bg-[#fafafa] dark:hover:bg-[#262626] hover:border-[#d4d4d4] dark:hover:border-[#404040]",
              "transition-colors duration-200"
            )}
          >
            <CameraIcon className="h-3.5 w-3.5 mr-2" />
            {displayAvatar ? "Change Photo" : "Upload Photo"}
          </Button>
          {displayAvatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isUploading}
              className={cn(
                "h-9 px-4 text-[13px] font-medium",
                "text-[#737373] dark:text-[#a3a3a3]",
                "hover:text-[#dc2626] dark:hover:text-[#ef4444] hover:bg-[#fafafa] dark:hover:bg-[#262626]",
                "transition-colors duration-200"
              )}
            >
              <CloseIcon className="h-3.5 w-3.5 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
