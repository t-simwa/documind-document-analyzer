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
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Status</Label>
        <Select
          value={filters.status?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("status", value === "all" ? undefined : (value.split(",") as any))
          }
        >
          <SelectTrigger className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
            <SelectItem value="all" className="text-xs">All statuses</SelectItem>
            <SelectItem value="ready" className="text-xs">Ready</SelectItem>
            <SelectItem value="processing" className="text-xs">Processing</SelectItem>
            <SelectItem value="error" className="text-xs">Error</SelectItem>
            <SelectItem value="ready,processing" className="text-xs">Ready & Processing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* File Type Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">File type</Label>
        <Select
          value={filters.fileType?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("fileType", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
            <SelectItem value="all" className="text-xs">All types</SelectItem>
            {availableFileTypes.map((type) => (
              <SelectItem key={type} value={type} className="text-xs">
                {type.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags Filter */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Tags</Label>
        <Select
          value={filters.tags?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("tags", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
            <SelectItem value="all" className="text-xs">All tags</SelectItem>
            {tags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id} className="text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
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
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Uploaded by</Label>
        <Select
          value={filters.uploadedBy?.join(",") || "all"}
          onValueChange={(value) =>
            updateFilter("uploadedBy", value === "all" ? undefined : value.split(","))
          }
        >
          <SelectTrigger className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
            <SelectItem value="all" className="text-xs">All users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id} className="text-xs">
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Date range</Label>
        <div className="space-y-1.5">
          <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-8 text-xs border-[#e5e5e5] dark:border-[#262626]",
                  !filters.dateFrom && "text-[#737373] dark:text-[#a3a3a3]"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {filters.dateFrom ? format(filters.dateFrom, "MMM d, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]" align="start">
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
                  "w-full justify-start text-left font-normal h-8 text-xs border-[#e5e5e5] dark:border-[#262626]",
                  !filters.dateTo && "text-[#737373] dark:text-[#a3a3a3]"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {filters.dateTo ? format(filters.dateTo, "MMM d, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]" align="start">
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
        <div className="space-y-2 pt-3 border-t border-[#e5e5e5] dark:border-[#262626]">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Active filters</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange({})}
              className="h-6 text-[10px] text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.status && filters.status.length > 0 && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                Status: {filters.status.join(", ")}
                <button
                  onClick={() => removeFilter("status")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.fileType && filters.fileType.length > 0 && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                Type: {filters.fileType.join(", ")}
                <button
                  onClick={() => removeFilter("fileType")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.tags && filters.tags.length > 0 && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                Tags: {filters.tags.length}
                <button
                  onClick={() => removeFilter("tags")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.uploadedBy && filters.uploadedBy.length > 0 && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                User: {filters.uploadedBy.length}
                <button
                  onClick={() => removeFilter("uploadedBy")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.dateFrom && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                From: {format(filters.dateFrom, "MMM d")}
                <button
                  onClick={() => removeFilter("dateFrom")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.dateTo && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                To: {format(filters.dateTo, "MMM d")}
                <button
                  onClick={() => removeFilter("dateTo")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="secondary" className="gap-1 h-5 px-1.5 text-[10px] font-normal bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]">
                Search: {filters.search}
                <button
                  onClick={() => removeFilter("search")}
                  className="ml-0.5 hover:bg-[#e5e5e5] dark:hover:bg-[#262626] rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
