import { useState, useEffect } from "react";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { ProfilePictureUpload } from "@/components/settings/ProfilePictureUpload";
import { PersonalInfoForm } from "@/components/settings/PersonalInfoForm";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { NotificationPreferencesComponent } from "@/components/settings/NotificationPreferences";
import { userProfileApi } from "@/services/api";
import type { UserProfile } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SettingsIcon, ProfileIcon, SecurityIcon, NotificationsIcon } from "@/components/settings/SettingsIcons";

export default function UserProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await userProfileApi.getProfile();
      setProfile(userProfile);
    } catch (error) {
      toast({
        title: "Failed to load profile",
        description: error instanceof Error ? error.message : "Could not load your profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  };

  const handleAvatarChange = (avatarUrl: string) => {
    if (profile) {
      setProfile({ ...profile, avatar: avatarUrl || undefined });
    }
  };

  const handleGlobalSearch = (query: string) => {
    toast({
      title: "Search",
      description: `Searching for "${query}" across documents and projects...`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <GlobalNavBar onSearch={handleGlobalSearch} />
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: ProfileIcon },
    { id: "security" as const, label: "Security", icon: SecurityIcon },
    { id: "notifications" as const, label: "Notifications", icon: NotificationsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
            {/* Header Section */}
            <div className="mb-10 lg:mb-12">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[#171717] dark:text-[#fafafa] mb-3">
                    Settings
                  </h1>
                  <p className="text-[15px] text-[#737373] dark:text-[#a3a3a3] font-normal">
                    Manage your account settings and preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="mb-8">
              <div className="flex items-center gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2.5 px-5 py-3.5 text-[15px] font-medium transition-colors duration-200",
                        "border-b-2 -mb-px",
                        isActive
                          ? "text-[#171717] dark:text-[#fafafa] border-[#171717] dark:border-[#fafafa]"
                          : "text-[#737373] dark:text-[#a3a3a3] border-transparent hover:text-[#171717] dark:hover:text-[#fafafa]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6 lg:space-y-8">
              {activeTab === "profile" && (
                <>
                  <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                      <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                        Profile Picture
                      </h2>
                      <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                        Upload a profile picture to personalize your account
                      </p>
                    </div>
                    <div className="p-6">
                      <ProfilePictureUpload
                        currentAvatar={profile?.avatar}
                        userName={profile?.name || "User"}
                        onAvatarChange={handleAvatarChange}
                      />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                    <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                      <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                        Personal Information
                      </h2>
                      <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                        Update your personal information and contact details
                      </p>
                    </div>
                    <div className="p-6">
                      <PersonalInfoForm onUpdate={handleProfileUpdate} />
                    </div>
                  </div>
                </>
              )}

              {activeTab === "security" && (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                      Change Password
                    </h2>
                    <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                      Update your password to keep your account secure
                    </p>
                  </div>
                  <div className="p-6">
                    <PasswordChangeForm />
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                      Notification Preferences
                    </h2>
                    <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                      Choose how and when you want to be notified
                    </p>
                  </div>
                  <div className="p-6">
                    <NotificationPreferencesComponent />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
