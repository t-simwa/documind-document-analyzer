import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { FavoriteProjects } from "@/components/dashboard/FavoriteProjects";
import { UsageStatistics } from "@/components/dashboard/UsageStatistics";
import { DocumentVolumeMetrics } from "@/components/dashboard/DocumentVolumeMetrics";
import { APIUsageTracking } from "@/components/dashboard/APIUsageTracking";
import { ActiveUsers } from "@/components/dashboard/ActiveUsers";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOrganizationDialog } from "@/components/organization/CreateOrganizationDialog";
import { OrganizationIcon, TeamIcon, SecurityIcon, WorkspaceIcon } from "@/components/organization/OrganizationIcons";
import { cn } from "@/lib/utils";

// Mock user role - replace with actual auth context when available
const getUserRole = (): "admin" | "user" => {
  // TODO: Replace with actual user role from auth context
  return "admin"; // For demo purposes, showing admin view
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const [justCreatedOrg, setJustCreatedOrg] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force re-render key
  const orgSectionRef = useRef<HTMLDivElement>(null);
  const userRole = getUserRole();
  const isAdmin = userRole === "admin";
  const hasOrganization = !!user?.organization_id;

  // Scroll to organization section when it appears after creation
  useEffect(() => {
    if (justCreatedOrg && hasOrganization && orgSectionRef.current) {
      // Wait a bit for the DOM to update
      const timer = setTimeout(() => {
        orgSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [justCreatedOrg, hasOrganization]);

  // Force re-check organization status when user changes
  useEffect(() => {
    // Force a re-render when organization_id changes
    console.log("Dashboard: user.organization_id changed:", user?.organization_id);
    setRefreshKey(prev => prev + 1);
  }, [user?.organization_id]);
  
  // Debug: Log when hasOrganization changes
  useEffect(() => {
    console.log("Dashboard: hasOrganization changed:", hasOrganization, "user:", user);
  }, [hasOrganization, user]);

  const handleGlobalSearch = (query: string) => {
    // Handle global search
    toast({
      title: "Search",
      description: `Searching for "${query}" across documents and projects...`,
    });
    // TODO: Implement actual search functionality when backend is ready
  };

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
            {/* Header Section */}
            <div className="mb-10 lg:mb-12">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[#171717] dark:text-[#fafafa] mb-3">
                    Dashboard
                  </h1>
                  <p className="text-[15px] text-[#737373] dark:text-[#a3a3a3] font-normal">
                    Overview of your workspace activity and metrics
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-10 lg:mb-12">
              <QuickActions />
            </div>

            {/* Organization Section */}
            <div key={`org-section-${user?.organization_id || 'none'}-${refreshKey}`} ref={orgSectionRef} className="mb-10 lg:mb-12">
              {hasOrganization ? (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
                        Organization Management
                      </h2>
                      <p className="text-[14px] text-[#737373] dark:text-[#a3a3a3]">
                        Manage your organization settings and team members
                      </p>
                    </div>
                    <OrganizationIcon className="h-6 w-6 text-[#737373] dark:text-[#a3a3a3]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      onClick={() => navigate("/app/organization/settings")}
                      variant="outline"
                      className="w-full justify-start h-auto py-4 px-5 hover:bg-[#fafafa] dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                          <OrganizationIcon className="h-5 w-5 text-[#171717] dark:text-[#fafafa]" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-[15px] text-[#171717] dark:text-[#fafafa]">
                            Organization Settings
                          </div>
                          <div className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                            Configure organization details
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/app/organization/members")}
                      variant="outline"
                      className="w-full justify-start h-auto py-4 px-5 hover:bg-[#fafafa] dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                          <TeamIcon className="h-5 w-5 text-[#171717] dark:text-[#fafafa]" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-[15px] text-[#171717] dark:text-[#fafafa]">
                            Team Members
                          </div>
                          <div className="text-[13px] text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                            Manage team and permissions
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  {/* Header Section */}
                  <div className="px-6 pt-6 pb-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                        <OrganizationIcon className="h-5 w-5 text-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#171717] dark:text-[#fafafa] mb-0.5">
                          Create your organization
                        </h2>
                        <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
                          Set up a workspace to collaborate with your team
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <TeamIcon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Team management
                          </p>
                          <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                            Invite and manage members
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <SecurityIcon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Security controls
                          </p>
                          <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                            Configure access policies
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <WorkspaceIcon className="h-3.5 w-3.5 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Workspace
                          </p>
                          <p className="text-[11px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                            Organize your resources
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-2">
                      <Button
                        onClick={() => setCreateOrgDialogOpen(true)}
                        className="w-full sm:w-auto h-10 px-5"
                        size="default"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create organization
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Create Organization Dialog */}
            <CreateOrganizationDialog
              open={createOrgDialogOpen}
              onOpenChange={setCreateOrgDialogOpen}
              onSuccess={async () => {
                // Force refresh user data to ensure we have the latest organization_id
                // Retry up to 3 times to ensure we get the updated user
                let retries = 0;
                let updatedUser = null;
                while (retries < 3 && !updatedUser?.organization_id) {
                  updatedUser = await refreshUser();
                  if (!updatedUser?.organization_id) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                    retries++;
                  }
                }
                
                // Mark that we just created an org to trigger scroll and highlight
                setJustCreatedOrg(true);
                // Force a re-render by updating the refresh key
                setRefreshKey(prev => prev + 1);
                // Remove highlight after 2 seconds
                setTimeout(() => {
                  setJustCreatedOrg(false);
                }, 2000);
              }}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 mb-10 lg:mb-12">
              {/* Left Column - 8 columns */}
              <div className="xl:col-span-8 space-y-6 lg:space-y-8">
                <RecentActivity />
                <FavoriteProjects />
              </div>

              {/* Right Column - 4 columns */}
              <div className="xl:col-span-4 space-y-6 lg:space-y-8">
                <DocumentVolumeMetrics />
                {isAdmin && <ActiveUsers />}
              </div>
            </div>

            {/* Admin Statistics Section */}
            {isAdmin && (
              <div className="space-y-6 lg:space-y-8">
                <UsageStatistics />
                <APIUsageTracking />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

