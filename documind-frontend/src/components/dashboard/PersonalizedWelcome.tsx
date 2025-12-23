import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { metricsApi } from "@/services/api";
import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

interface PersonalizedWelcomeProps {
  onSearch?: (query: string) => void;
}

export function PersonalizedWelcome({ onSearch }: PersonalizedWelcomeProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [documentsToday, setDocumentsToday] = useState<number | null>(null);
  const [queriesThisWeek, setQueriesThisWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Get user's first name
  const getUserName = () => {
    if (!user?.name) return "there";
    return user.name.split(" ")[0];
  };

  // Load quick stats
  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        // For now, we'll get basic metrics
        // In the future, we can add specific endpoints for today's documents and this week's queries
        const metrics = await metricsApi.getDocumentMetrics();
        // This is a placeholder - we'll need to add specific endpoints later
        setDocumentsToday(null);
        setQueriesThisWeek(null);
      } catch (error) {
        console.error("Failed to load quick stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadQuickStats();
  }, []);

  // Handle keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("dashboard-search-input")?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/app/documents?search=${encodeURIComponent(searchQuery)}`);
      }
      setSearchQuery("");
    }
  };

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-medium tracking-tight text-[#171717] dark:text-[#fafafa] mb-1">
          {getGreeting()}, {getUserName()}
        </h1>
        {documentsToday !== null || queriesThisWeek !== null ? (
          <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
            {documentsToday !== null && (
              <span>{documentsToday} document{documentsToday !== 1 ? "s" : ""} uploaded today</span>
            )}
            {documentsToday !== null && queriesThisWeek !== null && " • "}
            {queriesThisWeek !== null && (
              <span>{queriesThisWeek} quer{queriesThisWeek !== 1 ? "ies" : "y"} this week</span>
            )}
          </p>
        ) : null}
      </div>

      {/* Global Search */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737373] dark:text-[#a3a3a3]">
            <Search className="h-4 w-4" />
          </div>
          <Input
            id="dashboard-search-input"
            type="text"
            placeholder="Search documents, projects, or ask a question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-9 pr-20 h-10 bg-transparent border border-[#e5e5e5] dark:border-[#262626] rounded-md",
              "text-sm placeholder:text-[#737373] dark:placeholder:text-[#a3a3a3]",
              "transition-all duration-150",
              "hover:border-[#d4d4d4] dark:hover:border-[#404040]",
              "focus:border-[#171717] dark:focus:border-[#fafafa] focus:ring-1 focus:ring-[#171717]/5 dark:focus:ring-[#fafafa]/5"
            )}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] px-1.5 font-mono text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>
      </form>
    </div>
  );
}

