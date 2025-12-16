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
  <div className="group p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">
            {formatEntityText(text)}
          </h3>
        </div>
        {context && (
          <div className="text-xs text-muted-foreground leading-relaxed">
            {formatContext(context)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        {page && (
          <div className="px-2 py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] font-medium text-foreground/70 whitespace-nowrap">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-2 py-1 rounded-md bg-background border border-border/60 text-[10px] font-medium text-foreground/60 flex items-center gap-1 whitespace-nowrap">
            <Hash className="h-2.5 w-2.5" />
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
  <div className="group p-4 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-md transition-all duration-200">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground leading-tight font-mono">{formatted}</p>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-foreground/70 bg-muted/60 border border-border/50 uppercase tracking-wide">
            {currency}
          </span>
        </div>
        {context && (
          <div className="text-xs text-muted-foreground leading-relaxed">
            {formatContext(context)}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
        {page && (
          <div className="px-2 py-1 rounded-md bg-muted/60 border border-border/50 text-[10px] font-medium text-foreground/70 whitespace-nowrap">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-2 py-1 rounded-md bg-background border border-border/60 text-[10px] font-medium text-foreground/60 flex items-center gap-1 whitespace-nowrap">
            <Hash className="h-2.5 w-2.5" />
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
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
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
      <div className="flex flex-col items-center justify-center h-full px-6 py-16">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">Extracts not available</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
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
      <div className="flex flex-col items-center justify-center h-full px-6 py-16">
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">No entities found</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          No entities were extracted from this document.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 w-full">
        <div className="space-y-4 mb-6">
          <div className="space-y-0.5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Extracted Entities</h2>
            <p className="text-xs text-muted-foreground">
              Key information identified in this document
            </p>
          </div>
        </div>
        
        <Tabs defaultValue="organizations" className="w-full">
          <div className="overflow-x-auto -mx-6 px-6 mb-6">
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted/30 p-0.5 text-muted-foreground border border-border/50 min-w-max">
              <TabsTrigger 
                value="organizations" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Building2 className="h-3 w-3 mr-1.5" />
                <span>Organizations</span>
                {entities.organizations && entities.organizations.length > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-muted text-foreground/70">
                    {entities.organizations.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="people"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Users className="h-3 w-3 mr-1.5" />
                <span>People</span>
                {entities.people && entities.people.length > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-muted text-foreground/70">
                    {entities.people.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="dates"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <Calendar className="h-3 w-3 mr-1.5" />
                <span>Dates</span>
                {entities.dates && entities.dates.length > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-muted text-foreground/70">
                    {entities.dates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="monetary"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-3 w-3 mr-1.5" />
                <span>Monetary</span>
                {entities.monetaryValues && entities.monetaryValues.length > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-muted text-foreground/70">
                    {entities.monetaryValues.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="locations"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                <MapPin className="h-3 w-3 mr-1.5" />
                <span>Locations</span>
                {entities.locations && entities.locations.length > 0 && (
                  <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-semibold bg-muted text-foreground/70">
                    {entities.locations.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="organizations" className="space-y-3 mt-0">
            {entities.organizations && entities.organizations.length > 0 ? (
              entities.organizations.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-xs font-medium text-muted-foreground">No organizations found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="people" className="space-y-3 mt-0">
            {entities.people && entities.people.length > 0 ? (
              entities.people.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-xs font-medium text-muted-foreground">No people found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dates" className="space-y-3 mt-0">
            {entities.dates && entities.dates.length > 0 ? (
              entities.dates.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-xs font-medium text-muted-foreground">No dates found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="monetary" className="space-y-3 mt-0">
            {entities.monetaryValues && entities.monetaryValues.length > 0 ? (
              entities.monetaryValues.map((entity, index) => (
                <MonetaryEntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-xs font-medium text-muted-foreground">No monetary values found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="locations" className="space-y-3 mt-0">
            {entities.locations && entities.locations.length > 0 ? (
              entities.locations.map((entity, index) => (
                <EntityCard key={index} {...entity} />
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-xs font-medium text-muted-foreground">No locations found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

