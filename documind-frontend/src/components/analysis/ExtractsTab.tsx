import { Building2, Users, Calendar, DollarSign, MapPin, FileText, AlertCircle, Hash, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentEntities } from "@/types/api";
import React from "react";

interface ExtractsTabProps {
  entities: DocumentEntities | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Helper function to format text with markdown-like syntax
const formatEntityText = (text: string): React.ReactNode => {
  // Split by ** for bold text
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return <strong key={index} className="font-semibold text-foreground">{boldText}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper function to format context with structured content
const formatContext = (context?: string): React.ReactNode => {
  if (!context) return null;
  
  // Split by lines and format
  const lines = context.split('\n').filter(line => line.trim());
  
  return (
    <div className="space-y-1.5 mt-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Check for bullet points (•, *, -)
        if (/^[•\-\*]\s/.test(trimmed)) {
          const content = trimmed.replace(/^[•\-\*]\s/, '');
          return (
            <div key={index} className="flex items-start gap-2">
              <span className="text-muted-foreground mt-0.5">•</span>
              <span className="text-xs text-muted-foreground leading-relaxed flex-1">
                {formatEntityText(content)}
              </span>
            </div>
          );
        }
        
        // Check for numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.+)/);
          if (match) {
            return (
              <div key={index} className="flex items-start gap-2">
                <span className="text-[10px] font-medium text-muted-foreground mt-0.5 min-w-[16px]">
                  {match[1]}.
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed flex-1">
                  {formatEntityText(match[2])}
                </span>
              </div>
            );
          }
        }
        
        // Regular text
        return (
          <p key={index} className="text-xs text-muted-foreground leading-relaxed">
            {formatEntityText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

const EntityCard = ({ 
  text, 
  context, 
  page, 
  count 
}: { 
  text: string; 
  context?: string; 
  page?: number; 
  count?: number;
}) => (
  <div className="group p-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start gap-1.5">
          <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] leading-snug flex-1">
            {formatEntityText(text)}
          </h3>
        </div>
        {context && (
          <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
            {formatContext(context)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
        {page && (
          <div className="px-1.5 py-0.5 rounded-md bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1 whitespace-nowrap">
            <Hash className="h-2 w-2" />
            {count}
          </div>
        )}
      </div>
    </div>
  </div>
);

const MonetaryEntityCard = ({ 
  text, 
  formatted, 
  currency, 
  context, 
  page, 
  count 
}: { 
  text: string; 
  formatted: string; 
  currency: string; 
  context?: string; 
  page?: number; 
  count?: number;
}) => (
  <div className="group p-3 rounded-lg border border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] leading-tight font-mono">{formatted}</p>
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] uppercase tracking-wide">
            {currency}
          </span>
        </div>
        {context && (
          <div className="text-[10px] text-[#737373] dark:text-[#a3a3a3] leading-relaxed">
            {formatContext(context)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
        {page && (
          <div className="px-1.5 py-0.5 rounded-md bg-[#fafafa] dark:bg-[#0a0a0a] border border-[#e5e5e5] dark:border-[#262626] text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] whitespace-nowrap">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] text-[9px] font-medium text-[#737373] dark:text-[#a3a3a3] flex items-center gap-1 whitespace-nowrap">
            <Hash className="h-2 w-2" />
            {count}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ExtractsTab = ({ entities, isLoading, error, onRetry }: ExtractsTabProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full space-y-6">
          {/* Status Indicator */}
          <StatusIndicator
            status="loading"
            message="Extracting entities..."
            progress={undefined}
            className="mb-2"
          />
          
          {/* Loading Skeletons */}
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full">
          <StatusIndicator
            status="error"
            message="Unable to load extracts"
            onRetry={onRetry}
            className="mb-4"
          />
          <div className="text-center py-8">
            <p className="text-xs text-[#737373] dark:text-[#a3a3a3] mb-4">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-1.5 h-7 text-xs border-[#e5e5e5] dark:border-[#262626]"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!entities) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="w-8 h-8 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center mb-3">
          <FileText className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
        </div>
        <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1">Extracts not available</h3>
        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center max-w-sm">
          Entities will be extracted automatically once document processing is complete.
        </p>
      </div>
    );
  }

  const hasAnyEntities = 
    (entities.organizations && entities.organizations.length > 0) ||
    (entities.people && entities.people.length > 0) ||
    (entities.dates && entities.dates.length > 0) ||
    (entities.monetaryValues && entities.monetaryValues.length > 0) ||
    (entities.locations && entities.locations.length > 0);

  if (!hasAnyEntities) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="w-8 h-8 rounded-lg bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-center mb-3">
          <FileText className="h-3.5 w-3.5 text-[#737373] dark:text-[#a3a3a3]" />
        </div>
        <h3 className="text-xs font-medium text-[#171717] dark:text-[#fafafa] mb-1">No entities found</h3>
        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3] text-center max-w-sm">
          No entities were extracted from this document.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#fafafa] dark:bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 py-6 w-full">
        <div className="space-y-3 mb-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Extracted Entities</h2>
            <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
              Key information identified in this document
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="organizations" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 mb-4">
            <TabsList className="inline-flex h-7 items-center justify-start rounded-md bg-white dark:bg-[#171717] p-0.5 text-[#737373] dark:text-[#a3a3a3] border border-[#e5e5e5] dark:border-[#262626] min-w-max">
              <TabsTrigger 
                value="organizations" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#fafafa] dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa]"
              >
                <Building2 className="h-2.5 w-2.5 mr-1" />
                <span>Organizations</span>
                {entities.organizations && entities.organizations.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a3a3a3]">
                    {entities.organizations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#fafafa] dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa]"
              >
                <Users className="h-2.5 w-2.5 mr-1" />
                <span>People</span>
                {entities.people && entities.people.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a3a3a3]">
                    {entities.people.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="dates"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#fafafa] dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa]"
              >
                <Calendar className="h-2.5 w-2.5 mr-1" />
                <span>Dates</span>
                {entities.dates && entities.dates.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a3a3a3]">
                    {entities.dates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="monetary"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#fafafa] dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa]"
              >
                <DollarSign className="h-2.5 w-2.5 mr-1" />
                <span>Monetary</span>
                {entities.monetaryValues && entities.monetaryValues.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a3a3a3]">
                    {entities.monetaryValues.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="locations"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#fafafa] dark:data-[state=active]:bg-[#0a0a0a] data-[state=active]:text-[#171717] dark:data-[state=active]:text-[#fafafa]"
              >
                <MapPin className="h-2.5 w-2.5 mr-1" />
                <span>Locations</span>
                {entities.locations && entities.locations.length > 0 && (
                  <span className="ml-1 px-1 py-0.5 rounded text-[8px] font-medium bg-[#fafafa] dark:bg-[#0a0a0a] text-[#737373] dark:text-[#a3a3a3]">
                    {entities.locations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="organizations" className="space-y-2 mt-0">
            {entities.organizations && entities.organizations.length > 0 ? (
              entities.organizations.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">No organizations found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-2 mt-0">
            {entities.people && entities.people.length > 0 ? (
              entities.people.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">No people found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dates" className="space-y-2 mt-0">
            {entities.dates && entities.dates.length > 0 ? (
              entities.dates.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">No dates found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="monetary" className="space-y-2 mt-0">
            {entities.monetaryValues && entities.monetaryValues.length > 0 ? (
              entities.monetaryValues.map((entity, index) => (
                <MonetaryEntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">No monetary values found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations" className="space-y-2 mt-0">
            {entities.locations && entities.locations.length > 0 ? (
              entities.locations.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-[10px] font-medium text-[#737373] dark:text-[#a3a3a3]">No locations found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

