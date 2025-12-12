import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { FilterParams, DocumentTag, User } from "@/types/api";

interface DocumentFiltersProps {
  filters: FilterParams;
  onFiltersChange: (filters: FilterParams) => void;
  tags: DocumentTag[];
  users: User[];
  availableFileTypes: string[];
}

export const DocumentFilters = ({
  filters,
  onFiltersChange,
  tags,
  users,
  availableFileTypes,
}: DocumentFiltersProps) => {
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const updateFilter = <K extends keyof FilterParams>(key: K, value: FilterParams[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const removeFilter = (key: keyof FilterParams) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFiltersCount =
    (filters.status?.length || 0) +
    (filters.fileType?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.uploadedBy?.length || 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.projectId !== undefined ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <Select
          value={filters.status?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("status", value === "all" ? undefined : (value.split(",") as any))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="ready,processing">Ready & Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">File type</Label>
        <Select
          value={filters.fileType?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("fileType", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {availableFileTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tags</Label>
        <Select
          value={filters.tags?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("tags", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: tag.color || "#6b7280" }}
                  />
                  {tag.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Uploaded By Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Uploaded by</Label>
        <Select
          value={filters.uploadedBy?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("uploadedBy", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Date range</Label>
        <div className="space-y-2">
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => {
                  updateFilter("dateFrom", date || undefined);
                  setDateFromOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-9",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => {
                  updateFilter("dateTo", date || undefined);
                  setDateToOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Active filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.status && filters.status.length > 0 && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                Status: {filters.status.join(", ")}
                <button
                  onClick={() => removeFilter("status")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.fileType && filters.fileType.length > 0 && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                Type: {filters.fileType.join(", ")}
                <button
                  onClick={() => removeFilter("fileType")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.tags && filters.tags.length > 0 && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                Tags: {filters.tags.length}
                <button
                  onClick={() => removeFilter("tags")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.uploadedBy && filters.uploadedBy.length > 0 && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                User: {filters.uploadedBy.length}
                <button
                  onClick={() => removeFilter("uploadedBy")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                From: {format(filters.dateFrom, "MMM d")}
                <button
                  onClick={() => removeFilter("dateFrom")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                To: {format(filters.dateTo, "MMM d")}
                <button
                  onClick={() => removeFilter("dateTo")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-xs font-normal">
                Search: {filters.search}
                <button
                  onClick={() => removeFilter("search")}
                  className="ml-0.5 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
