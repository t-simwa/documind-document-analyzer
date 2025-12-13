import { Building2, Users, Calendar, DollarSign, MapPin, FileText, AlertCircle, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentEntities } from "@/types/api";

interface ExtractsTabProps {
  entities: DocumentEntities | null;
  isLoading?: boolean;
  error?: string | null;
}

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
  <div className="group p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground leading-tight">{text}</p>
        {context && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{context}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {page && (
          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border/50 text-[10px] font-medium text-foreground/70">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-medium text-foreground/60 flex items-center gap-1">
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
  <div className="group p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card hover:border-border hover:shadow-sm transition-all duration-200">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold text-foreground leading-tight">{formatted}</p>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground/60 bg-muted/60 border border-border/50 uppercase tracking-wide">
            {currency}
          </span>
        </div>
        {context && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{context}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {page && (
          <div className="px-2 py-0.5 rounded-md bg-muted/60 border border-border/50 text-[10px] font-medium text-foreground/70">
            p.{page}
          </div>
        )}
        {count && count > 1 && (
          <div className="px-2 py-0.5 rounded-md bg-background border border-border/60 text-[10px] font-medium text-foreground/60 flex items-center gap-1">
            <Hash className="h-2.5 w-2.5" />
            {count}
          </div>
        )}
      </div>
    </div>
  </div>
);

export const ExtractsTab = ({ entities, isLoading, error }: ExtractsTabProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full">
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
      <div className="flex flex-col items-center justify-center h-full px-6 py-16">
        <div className="w-10 h-10 rounded-lg bg-muted/80 flex items-center justify-center mb-4">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">Unable to load extracts</h3>
        <p className="text-xs text-muted-foreground text-center max-w-sm">{error}</p>
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

          <TabsContent value="organizations" className="space-y-2.5 mt-0">
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

          <TabsContent value="people" className="space-y-2.5 mt-0">
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

          <TabsContent value="dates" className="space-y-2.5 mt-0">
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

          <TabsContent value="monetary" className="space-y-2.5 mt-0">
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

          <TabsContent value="locations" className="space-y-2.5 mt-0">
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

