import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SaveIcon } from "./SettingsIcons";
import { userProfileApi } from "@/services/api";
import type { UserProfile, UpdateUserProfileRequest } from "@/types/api";
import { cn } from "@/lib/utils";

interface PersonalInfoFormProps {
  onUpdate?: (profile: UserProfile) => void;
}

export const PersonalInfoForm = ({ onUpdate }: PersonalInfoFormProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await userProfileApi.getProfile();
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
    } catch (error) {
      toast({
        title: "Failed to load profile",
        description: error instanceof Error ? error.message : "Could not load your profile information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const updateData: UpdateUserProfileRequest = {
        name: formData.name.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      };

      // Validate email format
      if (updateData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updateData.email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const updatedProfile = await userProfileApi.updateProfile(updateData);
      onUpdate?.(updatedProfile);
      toast({
        title: "Profile updated",
        description: "Your personal information has been successfully updated.",
      });
      // Redirect to documents after a short delay
      setTimeout(() => {
        navigate("/app/documents");
      }, 1000);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update your profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            Full Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your full name"
            required
            className={cn(
              "h-10 text-[15px]",
              "bg-white dark:bg-[#171717]",
              "border-[#e5e5e5] dark:border-[#262626]",
              "text-[#171717] dark:text-[#fafafa]",
              "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
              "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
              "transition-colors duration-200"
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email address"
            required
            className={cn(
              "h-10 text-[15px]",
              "bg-white dark:bg-[#171717]",
              "border-[#e5e5e5] dark:border-[#262626]",
              "text-[#171717] dark:text-[#fafafa]",
              "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
              "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
              "transition-colors duration-200"
            )}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter your phone number"
            className={cn(
              "h-10 text-[15px]",
              "bg-white dark:bg-[#171717]",
              "border-[#e5e5e5] dark:border-[#262626]",
              "text-[#171717] dark:text-[#fafafa]",
              "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
              "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
              "transition-colors duration-200"
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
          Bio
        </Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Tell us about yourself"
          rows={4}
          maxLength={500}
          className={cn(
            "text-[15px] resize-none",
            "bg-white dark:bg-[#171717]",
            "border-[#e5e5e5] dark:border-[#262626]",
            "text-[#171717] dark:text-[#fafafa]",
            "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
            "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
            "transition-colors duration-200"
          )}
        />
        <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
          {formData.bio.length}/500 characters
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className={cn(
            "h-10 px-5 text-[13px] font-medium",
            "bg-[#171717] dark:bg-[#fafafa]",
            "text-[#fafafa] dark:text-[#171717]",
            "hover:bg-[#262626] dark:hover:bg-[#e5e5e5]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <SaveIcon className="h-3.5 w-3.5 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
