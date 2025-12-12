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
  // All badges use the same style as viewer badge
  const badgeStyle = "bg-[#f5f5f5] dark:bg-[#262626] text-[#525252] dark:text-[#a3a3a3] border-[#e5e5e5] dark:border-[#404040]";
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5 h-5 border uppercase tracking-wide", badgeStyle)}>
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
    <div className="bg-white dark:bg-[#171717] border border-[#e5e5e5] dark:border-[#262626] rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="px-6 py-5 border-b border-[#e5e5e5] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#171717] dark:text-[#fafafa] mb-1">
              Active Users
            </h2>
            <p className="text-[13px] text-[#737373] dark:text-[#a3a3a3]">
              Team members and their activity
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5 border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]">
            <UsersIcon className="h-3.5 w-3.5" />
            {onlineCount}/{totalCount}
          </Badge>
        </div>
      </div>
      <div className="p-6">
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {users.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f5f5f5] dark:bg-[#262626] flex items-center justify-center">
                  <UsersIcon className="h-7 w-7 text-[#a3a3a3] dark:text-[#525252]" />
                </div>
                <p className="text-sm font-medium text-[#737373] dark:text-[#a3a3a3] mb-1">No active users</p>
                <p className="text-xs text-[#a3a3a3] dark:text-[#737373]">Users will appear here when active</p>
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl border border-[#f5f5f5] dark:border-[#262626] bg-white dark:bg-[#171717] hover:border-[#e5e5e5] dark:hover:border-[#404040] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a] transition-all duration-200"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-[#f5f5f5] dark:ring-[#262626]">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="bg-gradient-to-br from-[#171717]/10 to-[#171717]/5 dark:from-[#fafafa]/10 dark:to-[#fafafa]/5 text-[#171717] dark:text-[#fafafa] font-semibold text-sm">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-[#171717]",
                        getStatusColor(user.status)
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[14px] font-semibold text-[#171717] dark:text-[#fafafa] truncate">
                        {user.name}
                      </p>
                      {getRoleBadge(user.role)}
                    </div>
                    <p className="text-[12px] text-[#737373] dark:text-[#a3a3a3] truncate mb-2">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-3 text-[12px] text-[#737373] dark:text-[#a3a3a3]">
                      <span className="font-medium">{user.documentsAccessed} docs</span>
                      <span>•</span>
                      <span className="font-medium">{formatTimeAgo(user.lastActive)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

