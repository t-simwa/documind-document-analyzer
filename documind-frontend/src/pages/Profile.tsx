import { useState, useEffect } from "react";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { ProfilePictureUpload } from "@/components/settings/ProfilePictureUpload";
import { PersonalInfoForm } from "@/components/settings/PersonalInfoForm";
import { userProfileApi } from "@/services/api";
import type { UserProfile } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate("/login");
      return;
    }
    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Try to load profile from API, but fallback to auth user data if API fails
      try {
        const userProfile = await userProfileApi.getProfile();
        setProfile(userProfile);
      } catch (apiError) {
        // If API fails, use auth user data as fallback
        setProfile({
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          phone: undefined,
          bio: undefined,
          email_notifications: true,
          in_app_notifications: true,
          push_notifications: false,
        });
      }
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

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    // Refresh auth user data to sync changes
    await refreshUser();
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

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-medium tracking-tight text-[#171717] dark:text-[#fafafa] mb-1">
                    Profile
                  </h1>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                    Manage your profile information and personal details
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="space-y-4">
              {/* Profile Picture */}
              <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
                <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                  <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                    Profile Picture
                  </h2>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                    Upload a profile picture to personalize your account
                  </p>
                </div>
                <div className="p-4">
                  <ProfilePictureUpload
                    currentAvatar={profile?.avatar}
                    userName={profile?.name || "User"}
                    onAvatarChange={handleAvatarChange}
                  />
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
                <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                  <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                    Personal Information
                  </h2>
                  <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                    Update your personal information and contact details
                  </p>
                </div>
                <div className="p-4">
                  <PersonalInfoForm onUpdate={handleProfileUpdate} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

