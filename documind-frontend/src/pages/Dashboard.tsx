import { useState } from "react";
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

// Mock user role - replace with actual auth context when available
const getUserRole = (): "admin" | "user" => {
  // TODO: Replace with actual user role from auth context
  return "admin"; // For demo purposes, showing admin view
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const userRole = getUserRole();
  const isAdmin = userRole === "admin";

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

