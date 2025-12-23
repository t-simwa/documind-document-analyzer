import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { UploadIcon, ProjectIcon, DocumentIcon, SearchIcon } from "./DashboardIcons";

const actions = [
  {
    id: "upload",
    label: "Upload Document",
    description: "Add new files to your workspace",
    icon: UploadIcon,
    primary: true,
    onClick: (navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>) => {
      navigate("/app/documents?upload=true");
    },
  },
  {
    id: "project",
    label: "New Project",
    description: "Create a new project folder",
    icon: ProjectIcon,
    primary: false,
    onClick: (navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>) => {
      navigate("/app/documents?newProject=true");
    },
  },
  {
    id: "document",
    label: "New Document",
    description: "Create a blank document",
    icon: DocumentIcon,
    primary: false,
    onClick: (navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>) => {
      navigate("/app/documents");
      toast({
        title: "New Document",
        description: "Navigate to documents page to create a new document.",
      });
    },
  },
  {
    id: "search",
    label: "Search",
    description: "Find documents and content",
    icon: SearchIcon,
    primary: false,
    onClick: (navigate: ReturnType<typeof useNavigate>, toast: ReturnType<typeof useToast>) => {
      navigate("/app/documents");
      toast({
        title: "Search",
        description: "Navigate to documents page to search.",
      });
    },
  },
];

export function QuickActions() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => action.onClick(navigate, toast)}
            className={cn(
              "group relative overflow-hidden rounded-md border transition-all duration-150",
              "focus:outline-none focus:ring-1 focus:ring-offset-1",
              action.primary
                ? "bg-[#171717] dark:bg-[#fafafa] border-[#171717] dark:border-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5] focus:ring-[#171717] dark:focus:ring-[#fafafa]"
                : "bg-white dark:bg-[#171717] border-[#e5e5e5] dark:border-[#262626] text-[#171717] dark:text-[#fafafa] hover:border-[#d4d4d4] dark:hover:border-[#404040] hover:bg-[#fafafa] dark:hover:bg-[#262626] focus:ring-[#737373] dark:focus:ring-[#a3a3a3]"
            )}
          >
            <div className="relative p-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center",
                    action.primary
                      ? "bg-white/10 dark:bg-[#171717]/10"
                      : "bg-[#f5f5f5] dark:bg-[#262626]"
                  )}
                >
                  <Icon className={cn("h-4 w-4", action.primary ? "text-[#fafafa] dark:text-[#171717]" : "text-[#171717] dark:text-[#fafafa]")} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h3 className={cn("font-medium text-sm mb-0.5", action.primary ? "text-[#fafafa] dark:text-[#171717]" : "text-[#171717] dark:text-[#fafafa]")}>
                    {action.label}
                  </h3>
                  <p className={cn("text-xs", action.primary ? "text-[#fafafa]/70 dark:text-[#171717]/70" : "text-[#737373] dark:text-[#a3a3a3]")}>
                    {action.description}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

