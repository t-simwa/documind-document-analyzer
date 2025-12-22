import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { LockIcon, EyeIcon, EyeOffIcon } from "./SettingsIcons";
import { userProfileApi } from "@/services/api";
import { cn } from "@/lib/utils";

export const PasswordChangeForm = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword = "Password must contain uppercase, lowercase, and number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      await userProfileApi.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});

      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
      // Redirect to documents after a short delay
      setTimeout(() => {
        navigate("/app/documents");
      }, 1000);
    } catch (error) {
      toast({
        title: "Failed to change password",
        description: error instanceof Error ? error.message : "Could not update your password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            Current Password
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => {
                setFormData({ ...formData, currentPassword: e.target.value });
                if (errors.currentPassword) {
                  setErrors({ ...errors, currentPassword: "" });
                }
              }}
              placeholder="Enter your current password"
              className={cn(
                "h-10 text-[15px] pr-10",
                "bg-white dark:bg-[#171717]",
                "border-[#e5e5e5] dark:border-[#262626]",
                "text-[#171717] dark:text-[#fafafa]",
                "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
                "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
                errors.currentPassword && "border-[#dc2626] dark:border-[#ef4444]",
                "transition-colors duration-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors duration-200"
            >
              {showPasswords.current ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-[#dc2626] dark:text-[#ef4444]">{errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            New Password
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => {
                setFormData({ ...formData, newPassword: e.target.value });
                if (errors.newPassword) {
                  setErrors({ ...errors, newPassword: "" });
                }
              }}
              placeholder="Enter your new password"
              className={cn(
                "h-10 text-[15px] pr-10",
                "bg-white dark:bg-[#171717]",
                "border-[#e5e5e5] dark:border-[#262626]",
                "text-[#171717] dark:text-[#fafafa]",
                "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
                "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
                errors.newPassword && "border-[#dc2626] dark:border-[#ef4444]",
                "transition-colors duration-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors duration-200"
            >
              {showPasswords.new ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-[#dc2626] dark:text-[#ef4444]">{errors.newPassword}</p>
          )}
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
            Must be at least 8 characters with uppercase, lowercase, and number
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa]">
            Confirm New Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => {
                setFormData({ ...formData, confirmPassword: e.target.value });
                if (errors.confirmPassword) {
                  setErrors({ ...errors, confirmPassword: "" });
                }
              }}
              placeholder="Confirm your new password"
              className={cn(
                "h-10 text-[15px] pr-10",
                "bg-white dark:bg-[#171717]",
                "border-[#e5e5e5] dark:border-[#262626]",
                "text-[#171717] dark:text-[#fafafa]",
                "placeholder:text-[#a3a3a3] dark:placeholder:text-[#525252]",
                "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717] dark:focus:ring-[#fafafa]",
                errors.confirmPassword && "border-[#dc2626] dark:border-[#ef4444]",
                "transition-colors duration-200"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] transition-colors duration-200"
            >
              {showPasswords.confirm ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-[#dc2626] dark:text-[#ef4444]">{errors.confirmPassword}</p>
          )}
        </div>
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
              Updating...
            </>
          ) : (
            <>
              <LockIcon className="h-3.5 w-3.5 mr-2" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
