import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ZapIcon, TrendingUpIcon, FileTextIcon } from "./DashboardIcons";
import { documentsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface Insight {
  id: string;
  type: "trend" | "recommendation" | "pattern";
  title: string;
  description: string;
  action?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function QuickInsights() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch documents to generate insights
      const documents = await documentsApi.list({ limit: 100 });
      
      // Generate insights based on data
      const generatedInsights: Insight[] = [];
      
      // Check for recent uploads
      const recentDocs = documents.documents.filter(d => {
        const uploadDate = new Date(d.uploaded_at);
        const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpload <= 7;
      });
      
      if (recentDocs.length > 0) {
        generatedInsights.push({
          id: "recent-uploads",
          type: "trend",
          title: "Active Week",
          description: `You've uploaded ${recentDocs.length} document${recentDocs.length > 1 ? 's' : ''} this week`,
          icon: TrendingUpIcon,
          color: "text-blue-500"
        });
      }
      
      // Check for processing documents
      const processingDocs = documents.documents.filter(d => d.status === "processing");
      if (processingDocs.length > 0) {
        generatedInsights.push({
          id: "processing",
          type: "recommendation",
          title: "Documents Processing",
          description: `${processingDocs.length} document${processingDocs.length > 1 ? 's are' : ' is'} currently being processed`,
          action: "View documents",
          icon: FileTextIcon,
          color: "text-yellow-500"
        });
      }
      
      // Check for document types
      const docTypes = new Map<string, number>();
      documents.documents.forEach(doc => {
        const type = doc.file_type || "unknown";
        docTypes.set(type, (docTypes.get(type) || 0) + 1);
      });
      
      if (docTypes.size > 0) {
        const mostCommonType = Array.from(docTypes.entries()).sort((a, b) => b[1] - a[1])[0];
        if (mostCommonType[1] > 3) {
          generatedInsights.push({
            id: "doc-type-pattern",
            type: "pattern",
            title: "Document Type Pattern",
            description: `Most of your documents are ${mostCommonType[0].toUpperCase()} files (${mostCommonType[1]} total)`,
            icon: FileTextIcon,
            color: "text-purple-500"
          });
        }
      }
      
      // Default insight if no specific insights
      if (generatedInsights.length === 0) {
        generatedInsights.push({
          id: "welcome",
          type: "recommendation",
          title: "Get Started",
          description: "Upload your first document to start analyzing with AI",
          action: "Upload document",
          icon: ZapIcon,
          color: "text-blue-500"
        });
      }
      
      setInsights(generatedInsights.slice(0, 3)); // Limit to 3 insights
    } catch (error) {
      console.error("Failed to fetch insights:", error);
      toast({
        title: "Error",
        description: "Failed to load insights",
        variant: "destructive",
      });
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
        <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Quick Insights
          </h2>
        </div>
        <div className="p-4">
          <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
          Quick Insights
        </h2>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {insights.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.id}
                className="p-2.5 rounded-md border border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] hover:bg-[#f5f5f5] dark:hover:bg-[#0f0f0f] transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className={cn("flex-shrink-0 w-5 h-5 rounded-md bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center", insight.color)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <h4 className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">
                        {insight.title}
                      </h4>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0 h-4 border-[#e5e5e5] dark:border-[#262626] text-[#737373] dark:text-[#a3a3a3]"
                      >
                        {insight.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button className="mt-1.5 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                        {insight.action} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
