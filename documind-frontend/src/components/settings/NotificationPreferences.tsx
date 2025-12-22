import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { SaveIcon, NotificationsIcon, EmailIcon, MobileIcon } from "./SettingsIcons";
import { userProfileApi } from "@/services/api";
import type { NotificationPreferences } from "@/types/api";
import { cn } from "@/lib/utils";

export const NotificationPreferencesComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: {
      documentProcessed: false,
      documentShared: false,
      comments: false,
      mentions: false,
      weeklyDigest: false,
    },
    inAppNotifications: {
      documentProcessed: false,
      documentShared: false,
      comments: false,
      mentions: false,
    },
    pushNotifications: {
      documentProcessed: false,
      documentShared: false,
      comments: false,
      mentions: false,
    },
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await userProfileApi.getNotificationPreferences();
      setPreferences(prefs);
    } catch (error) {
      toast({
        title: "Failed to load preferences",
        description: error instanceof Error ? error.message : "Could not load notification preferences",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await userProfileApi.updateNotificationPreferences(preferences);
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been successfully updated.",
      });
      // Redirect to documents after a short delay
      setTimeout(() => {
        navigate("/app/documents");
      }, 1000);
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update notification preferences",
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

  const notificationSections = [
    {
      id: "email" as const,
      title: "Email Notifications",
      description: "Receive notifications via email",
      icon: EmailIcon,
      preferences: preferences.emailNotifications,
      items: [
        { key: "documentProcessed", label: "Document Processed", description: "When a document finishes processing" },
        { key: "documentShared", label: "Document Shared", description: "When someone shares a document with you" },
        { key: "comments", label: "Comments", description: "When someone comments on a document" },
        { key: "mentions", label: "Mentions", description: "When someone mentions you in a comment" },
        { key: "weeklyDigest", label: "Weekly Digest", description: "Weekly summary of your activity" },
      ],
    },
    {
      id: "inApp" as const,
      title: "In-App Notifications",
      description: "Show notifications in the application",
      icon: NotificationsIcon,
      preferences: preferences.inAppNotifications,
      items: [
        { key: "documentProcessed", label: "Document Processed", description: "When a document finishes processing" },
        { key: "documentShared", label: "Document Shared", description: "When someone shares a document with you" },
        { key: "comments", label: "Comments", description: "When someone comments on a document" },
        { key: "mentions", label: "Mentions", description: "When someone mentions you in a comment" },
      ],
    },
    {
      id: "push" as const,
      title: "Push Notifications",
      description: "Receive push notifications on your device",
      icon: MobileIcon,
      preferences: preferences.pushNotifications,
      items: [
        { key: "documentProcessed", label: "Document Processed", description: "When a document finishes processing" },
        { key: "documentShared", label: "Document Shared", description: "When someone shares a document with you" },
        { key: "comments", label: "Comments", description: "When someone comments on a document" },
        { key: "mentions", label: "Mentions", description: "When someone mentions you in a comment" },
      ],
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {notificationSections.map((section, sectionIndex) => {
        const Icon = section.icon;
        const categoryKey = section.id === "email" ? "emailNotifications" : section.id === "inApp" ? "inAppNotifications" : "pushNotifications";
        
        return (
          <div key={section.id} className={cn(sectionIndex > 0 && "pt-8 border-t border-[#e5e5e5] dark:border-[#262626]")}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                <Icon className="h-5 w-5 text-[#171717] dark:text-[#fafafa]" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#171717] dark:text-[#fafafa] mb-0.5">
                  {section.title}
                </h3>
                <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="space-y-4 pl-[52px]">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start justify-between gap-4 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`${section.id}-${item.key}`}
                      className="text-[15px] font-medium text-[#171717] dark:text-[#fafafa] cursor-pointer mb-1 block"
                    >
                      {item.label}
                    </Label>
                    <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                      {item.description}
                    </p>
                  </div>
                  <Switch
                    id={`${section.id}-${item.key}`}
                    checked={section.preferences[item.key as keyof typeof section.preferences] as boolean}
                    onCheckedChange={(checked) =>
                      handleToggle(categoryKey as keyof NotificationPreferences, item.key, checked)
                    }
                    className="flex-shrink-0 mt-1"
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex justify-end pt-6 border-t border-[#e5e5e5] dark:border-[#262626]">
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
              Save Preferences
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
