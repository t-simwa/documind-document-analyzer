import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { UsersIcon } from "./DashboardIcons";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "analyst" | "viewer";
  status: "online" | "away" | "offline";
  lastActive: Date;
  documentsAccessed: number;
}

// Mock users data - replace with actual API call
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    status: "online",
    lastActive: new Date(Date.now() - 5 * 60 * 1000),
    documentsAccessed: 24,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "analyst",
    status: "online",
    lastActive: new Date(Date.now() - 15 * 60 * 1000),
    documentsAccessed: 18,
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "viewer",
    status: "away",
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    documentsAccessed: 12,
  },
  {
    id: "4",
    name: "Alice Williams",
    email: "alice.williams@example.com",
    role: "analyst",
    status: "offline",
    lastActive: new Date(Date.now() - 5 * 60 * 60 * 1000),
    documentsAccessed: 8,
  },
];

const getStatusColor = (status: User["status"]) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    case "offline":
      return "bg-red-500";
  }
};

const getRoleBadge = (role: User["role"]) => {
  const badgeStyle = "bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3] border-[#e5e5e5] dark:border-[#404040]";
  return (
    <Badge variant="outline" className={cn("text-[10px] font-medium px-1.5 py-0 h-4 border uppercase tracking-wide", badgeStyle)}>
      {role}
    </Badge>
  );
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export function ActiveUsers() {
  // TODO: Replace with actual API call
  const users = mockUsers;
  const onlineCount = users.filter((u) => u.status === "online").length;
  const totalCount = users.length;

  return (
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-lg">
      <div className="px-4 py-3 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">
            Active Users
          </h2>
          <Badge variant="outline" className="flex items-center gap-1 h-5 px-1.5 text-[10px] border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]">
            <UsersIcon className="h-3 w-3" />
            {onlineCount}/{totalCount}
          </Badge>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-2">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[#737373] dark:text-[#a3a3a3]">No active users</p>
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-2.5 p-2 rounded-md hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-[#f5f5f5] dark:bg-[#262626] text-[#171717] dark:text-[#fafafa] font-medium text-xs">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-white dark:border-[#171717]",
                      getStatusColor(user.status)
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-medium text-[#171717] dark:text-[#fafafa] truncate">
                      {user.name}
                    </p>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                    <span>{user.documentsAccessed} docs</span>
                    <span>•</span>
                    <span>{formatTimeAgo(user.lastActive)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

