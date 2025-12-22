import { useState } from "react";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { PasswordChangeForm } from "@/components/settings/PasswordChangeForm";
import { NotificationPreferencesComponent } from "@/components/settings/NotificationPreferences";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SettingsIcon, SecurityIcon, NotificationsIcon, OrganizationIcon } from "@/components/settings/SettingsIcons";
import { Users, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/organization/CreateOrganizationDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UserProfileSettings() {
  const [activeTab, setActiveTab] = useState<"security" | "notifications" | "organization">("security");
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();


  const handleGlobalSearch = (query: string) => {
    toast({
      title: "Search",
      description: `Searching for "${query}" across documents and projects...`,
    });
  };

  const tabs = [
    { id: "security" as const, label: "Security", icon: SecurityIcon },
    { id: "notifications" as const, label: "Notifications", icon: NotificationsIcon },
    { id: "organization" as const, label: "Organization", icon: OrganizationIcon },
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
              <div className="flex items-center gap-1 border-b border-[#e5e5e5] dark:border-[#262626] overflow-x-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-2.5 px-5 py-3.5 text-[15px] font-medium transition-colors duration-200 whitespace-nowrap",
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

              {activeTab === "organization" && (
                <div className="space-y-6">
                  {user?.organization_id ? (
                    <>
                      {/* Organization Settings Card */}
                      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                                Organization Settings
                              </h2>
                              <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                                Manage your organization details, plan, and security settings
                              </p>
                            </div>
                            <OrganizationIcon className="h-5 w-5 text-[#737373] dark:text-[#a3a3a3]" />
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-[14px] text-[#737373] dark:text-[#a3a3a3] mb-4">
                            Configure your organization settings including name, subscription plan, and security preferences.
                          </p>
                          <Button
                            onClick={() => navigate("/app/organization/settings")}
                            className="w-full sm:w-auto"
                            variant="outline"
                          >
                            Open Organization Settings
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Team Members Card */}
                      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                        <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                                Team Members
                              </h2>
                              <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                                Invite, manage, and organize your team members
                              </p>
                            </div>
                            <Users className="h-5 w-5 text-[#737373] dark:text-[#a3a3a3]" />
                          </div>
                        </div>
                        <div className="p-6">
                          <p className="text-[14px] text-[#737373] dark:text-[#a3a3a3] mb-4">
                            View all team members, invite new users, and manage roles and permissions.
                          </p>
                          <Button
                            onClick={() => navigate("/app/organization/settings?tab=members")}
                            className="w-full sm:w-auto"
                            variant="outline"
                          >
                            Manage Team Members
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                              Create Your Organization
                            </h2>
                            <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                              Set up an organization to manage your team and collaborate
                            </p>
                          </div>
                          <OrganizationIcon className="h-5 w-5 text-[#737373] dark:text-[#a3a3a3]" />
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-[14px] text-[#737373] dark:text-[#a3a3a3] mb-4">
                          Organizations help you manage team members, set permissions, and organize your workspace. Create one to get started.
                        </p>
                        <Button
                          onClick={() => setCreateOrgDialogOpen(true)}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create Organization
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create Organization Dialog */}
            <CreateOrganizationDialog
              open={createOrgDialogOpen}
              onOpenChange={setCreateOrgDialogOpen}
              onSuccess={async () => {
                await refreshUser();
                setActiveTab("organization");
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
