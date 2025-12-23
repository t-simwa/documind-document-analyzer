import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { PersonalizedWelcome } from "@/components/dashboard/PersonalizedWelcome";
import { RecentWork } from "@/components/dashboard/RecentWork";
import { DocumentHealthMonitor } from "@/components/dashboard/DocumentHealthMonitor";
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
import { organizationsApi } from "@/services/api";
import type { Organization } from "@/types/api";
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
  const [organization, setOrganization] = useState<Organization | null>(null);
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

  // Load organization data when user has an organization
  useEffect(() => {
    const loadOrganization = async () => {
      if (user?.organization_id) {
        try {
          const org = await organizationsApi.get(user.organization_id);
          setOrganization(org);
        } catch (error) {
          console.error("Failed to load organization:", error);
        }
      } else {
        setOrganization(null);
      }
    };
    loadOrganization();
  }, [user?.organization_id]);

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
        <main className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-6 lg:py-8">
            {/* Personalized Welcome Section */}
            <PersonalizedWelcome onSearch={handleGlobalSearch} />

            {/* Quick Actions */}
            <div className="mb-6">
              <QuickActions />
            </div>

            {/* Organization Section */}
            <div key={`org-section-${user?.organization_id || 'none'}-${refreshKey}`} ref={orgSectionRef} className="mb-6">
              {hasOrganization ? (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
                      {organization?.name || "Organization"}
                    </h2>
                    <OrganizationIcon className="h-4 w-4 text-[#737373] dark:text-[#a3a3a3]" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => navigate("/app/organization/settings")}
                      variant="outline"
                      className="w-full justify-start h-auto py-2.5 px-3 hover:bg-[#fafafa] dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                          <OrganizationIcon className="h-3.5 w-3.5 text-[#171717] dark:text-[#fafafa]" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-xs text-[#171717] dark:text-[#fafafa]">
                            Settings
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/app/organization/settings?tab=members")}
                      variant="outline"
                      className="w-full justify-start h-auto py-2.5 px-3 hover:bg-[#fafafa] dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                          <TeamIcon className="h-3.5 w-3.5 text-[#171717] dark:text-[#fafafa]" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-xs text-[#171717] dark:text-[#fafafa]">
                            Team Members
                          </div>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg overflow-hidden">
                  {/* Header Section */}
                  <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center">
                        <OrganizationIcon className="h-4 w-4 text-foreground" />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                          Create your organization
                        </h2>
                        <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">
                          Set up a workspace to collaborate with your team
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-4 py-4 space-y-3">
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <TeamIcon className="h-3 w-3 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Team management
                          </p>
                          <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                            Invite and manage members
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <SecurityIcon className="h-3 w-3 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Security controls
                          </p>
                          <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                            Configure access policies
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 p-2.5 rounded-md bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626]">
                        <div className="flex-shrink-0 w-6 h-6 rounded-md bg-foreground/5 dark:bg-foreground/10 flex items-center justify-center mt-0.5">
                          <WorkspaceIcon className="h-3 w-3 text-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-0.5">
                            Workspace
                          </p>
                          <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                            Organize your resources
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-1">
                      <Button
                        onClick={() => setCreateOrgDialogOpen(true)}
                        className="w-full sm:w-auto h-8 px-4 text-xs"
                        size="sm"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mb-6">
              {/* Left Column - 8 columns */}
              <div className="xl:col-span-8 space-y-6 lg:space-y-8">
                <RecentWork />
                <RecentActivity />
                <FavoriteProjects />
              </div>

              {/* Right Column - 4 columns */}
              <div className="xl:col-span-4 space-y-6 lg:space-y-8">
                <DocumentHealthMonitor />
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

