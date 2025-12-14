import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  LogOut,
  FileText,
  Folder,
  Command,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";

// Custom unique icons for world-class SaaS platform
const SearchIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="m13.5 13.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NotificationIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path 
      d="M10 2a5 5 0 0 1 5 5v2.586l1.293 1.293a1 1 0 0 1 .707 1.707H3a1 1 0 0 1-.707-1.707L3.586 9.586V7a5 5 0 0 1 5-5z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M7 15a3 3 0 0 0 6 0" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const HelpIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <path 
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M7.5 7.5a2.5 2.5 0 0 1 4.5 1.5c0 1-1.5 1.5-1.5 1.5" 
      stroke="currentColor" 
      strokeWidth="1.5" 
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="10" cy="13.5" r="0.75" fill="currentColor"/>
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M5 16.5c0-2.5 2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  </svg>
);
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  read: boolean;
}

interface GlobalNavBarProps {
  onSearch?: (query: string) => void;
}

export const GlobalNavBar = ({ onSearch }: GlobalNavBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Document processed",
      message: "Your document 'Report.pdf' has been successfully processed.",
      type: "success",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
    },
    {
      id: "2",
      title: "New feature available",
      message: "Project folders are now available. Organize your documents better!",
      type: "info",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
  ]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Check if we're on dashboard or settings page (show logo only on these pages)
  const showLogo = location.pathname === "/app" || location.pathname === "/app/" || location.pathname === "/app/settings";

  // Mock user data - replace with actual auth context when available
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: undefined,
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        // Default search behavior - navigate to search results
        navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
      }
      setIsSearchFocused(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    );
    // Handle notification action based on type
    toast({
      title: notification.title,
      description: notification.message,
    });
  };

  const handleLogout = () => {
    // TODO: Implement actual logout logic when auth is available
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: "Notifications marked as read",
      description: "All notifications have been marked as read.",
    });
  };

  return (
    <nav className="h-[64px] border-b border-[#e5e5e5] dark:border-[#262626] bg-white/80 dark:bg-[#171717]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 dark:supports-[backdrop-filter]:bg-[#171717]/50 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left Section: Logo (Dashboard and Settings only) */}
        {showLogo && (
          <div className="flex-shrink-0 mr-6">
            <Link to="/app" className="flex items-center">
              <Logo showText={true} />
            </Link>
          </div>
        )}
        
        {/* Center Section: Global Search Bar */}
        <div className={cn(
          "flex-1 flex justify-center min-w-0",
          showLogo ? "px-4" : "px-8"
        )}>
          <form onSubmit={handleSearch} className="relative hidden md:block w-full max-w-[600px]">
            <div className="relative group">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-foreground/5 via-foreground/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              <div className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60 transition-colors duration-200 group-hover:text-muted-foreground">
                <SearchIcon />
              </div>
              <Input
                type="text"
                placeholder="Search documents, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className={cn(
                  "w-full pl-10 pr-20 h-[36px] bg-muted/30 border border-border/50 rounded-lg",
                  "text-sm placeholder:text-muted-foreground/50",
                  "transition-all duration-200",
                  "hover:bg-muted/40 hover:border-border/70",
                  isSearchFocused && "bg-muted/50 border-foreground/20 ring-1 ring-foreground/10 shadow-sm"
                )}
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery && (
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded-md border border-border/50 bg-background/80 px-2 font-mono text-[11px] font-medium text-muted-foreground/70 shadow-sm">
                    <Command className="h-3 w-3" />
                    K
                  </kbd>
                )}
                {!searchQuery && (
                  <kbd className="pointer-events-none hidden lg:inline-flex h-6 select-none items-center gap-1 rounded-md border border-border/30 bg-background/60 px-2 font-mono text-[11px] font-medium text-muted-foreground/50">
                    <Command className="h-3 w-3" />
                    K
                  </kbd>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors duration-200"
            onClick={() => {
              toast({
                title: "Search",
                description: "Search functionality - tap the search bar above",
              });
            }}
          >
            <SearchIcon />
          </Button>

          {/* Help & Support */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors duration-200"
              >
                <HelpIcon />
                <span className="sr-only">Help & Support</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px] rounded-lg border-border/50 shadow-lg">
              <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                Help & Support
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/50" />
              <DropdownMenuItem asChild className="px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5">
                <Link to="/resources" className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-muted-foreground/70" />
                  <span className="text-sm">Documentation</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate("/resources")}
                className="px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5"
              >
                <div className="mr-2.5 h-4 w-4 text-muted-foreground/70">
                  <HelpIcon />
                </div>
                <span className="text-sm">Support Center</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.open("https://github.com", "_blank")}
                className="px-3 py-2.5 cursor-pointer rounded-md mx-1 my-0.5"
              >
                <Folder className="mr-2.5 h-4 w-4 text-muted-foreground/70" />
                <span className="text-sm">Community</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/50 my-1" />
              <DropdownMenuItem 
                onClick={() => toast({ title: "Contact Support", description: "Opening support form..." })} 
                className="px-3 py-2.5 cursor-pointer rounded-md mx-1"
              >
                <span className="text-sm">Contact Support</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-9 w-9 rounded-lg hover:bg-muted/50 transition-colors duration-200"
              >
                <NotificationIcon />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md bg-foreground border border-border/50 shadow-lg">
                    <span className="text-[10px] font-bold text-background leading-none">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  </div>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px] rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-foreground/10 text-foreground text-[10px] font-semibold border border-border/30">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-muted-foreground/70 hover:text-foreground transition-colors duration-200 px-2 py-1 rounded-md hover:bg-muted/40"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-[440px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="px-5 py-16 text-center">
                    <div className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4 flex items-center justify-center">
                      <NotificationIcon />
                    </div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">No notifications</p>
                    <p className="text-xs text-muted-foreground/50">You're all caught up</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {notifications.map((notification, index) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={cn(
                          "w-full text-left px-5 py-3.5 transition-all duration-200 border-b border-border/20 last:border-b-0",
                          "hover:bg-muted/40 active:bg-muted/50",
                          !notification.read && "bg-foreground/5 hover:bg-foreground/10"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="mt-1.5 flex-shrink-0">
                              <div className="h-2 w-2 rounded-sm bg-foreground rotate-45" />
                            </div>
                          )}
                          {notification.read && <div className="w-2" />}
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <p className="text-sm font-semibold text-foreground leading-tight">
                                {notification.title}
                              </p>
                              <span className="text-[10px] font-medium text-muted-foreground/60 whitespace-nowrap flex-shrink-0">
                                {formatNotificationTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground/80 leading-relaxed">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-border/30 bg-muted/10">
                  <button
                    onClick={() => navigate("/app/notifications")}
                    className="w-full px-5 py-3 text-xs font-semibold text-muted-foreground/70 hover:text-foreground transition-colors duration-200 hover:bg-muted/30"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-9 w-9 rounded-lg hover:bg-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:ring-offset-2 focus:ring-offset-background">
                <Avatar className="h-9 w-9 ring-2 ring-border/40 ring-offset-0 transition-all duration-200 hover:ring-border/60">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-foreground/15 to-foreground/8 text-foreground font-semibold text-sm">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px] rounded-xl border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden">
              {/* Profile Header */}
              <div className="px-5 py-4 border-b border-border/30 bg-muted/20">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-11 w-11 ring-2 ring-border/30">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-foreground/15 to-foreground/8 text-foreground font-semibold">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground/70 leading-tight truncate mt-0.5">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <DropdownMenuItem asChild className="px-0 mx-0">
                  <Link 
                    to="/app/profile" 
                    className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-foreground/90 hover:text-foreground transition-colors duration-200 hover:bg-muted/40 w-full"
                  >
                    <div className="h-4 w-4 text-muted-foreground/60">
                      <ProfileIcon />
                    </div>
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-0 mx-0">
                  <Link 
                    to="/app/settings" 
                    className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-foreground/90 hover:text-foreground transition-colors duration-200 hover:bg-muted/40 w-full"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground/60" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </div>

              {/* Logout Section */}
              <div className="border-t border-border/30 bg-muted/10">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-destructive/90 hover:text-destructive transition-colors duration-200 hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-border/50 px-4 py-3 bg-muted/20">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60">
            <SearchIcon />
          </div>
          <Input
            type="text"
            placeholder="Search documents, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-[36px] bg-background/50 border-border/50 rounded-lg text-sm placeholder:text-muted-foreground/50"
          />
        </form>
      </div>
    </nav>
  );
};

// Helper function to format notification timestamps
function formatNotificationTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return timestamp.toLocaleDateString();
}

