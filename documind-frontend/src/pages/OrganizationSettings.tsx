import { useState, useEffect } from "react";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { organizationsApi } from "@/services/api";
import type { Organization, OrganizationSettings, UpdateOrganizationRequest, UpdateOrganizationSettingsRequest, OrganizationMember, InviteMemberRequest, UpdateMemberRoleRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Shield, Users, UserPlus, Trash2, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function OrganizationSettings() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"general" | "security" | "members">(
    (tabParam === "members" || tabParam === "security" || tabParam === "general") 
      ? tabParam 
      : "general"
  );
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "analyst" | "viewer">("analyst");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab !== "general") {
      setSearchParams({ tab: activeTab });
    } else {
      setSearchParams({});
    }
  }, [activeTab, setSearchParams]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (!user.organization_id) {
      toast({
        title: "No Organization",
        description: "You are not part of an organization. Please create one first.",
        variant: "destructive",
      });
      navigate("/app");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    if (!user?.organization_id) return;
    
    setIsLoading(true);
    try {
      const [org, orgSettings] = await Promise.all([
        organizationsApi.get(user.organization_id),
        organizationsApi.getSettings(user.organization_id),
      ]);
      setOrganization(org);
      setSettings(orgSettings);
    } catch (error) {
      toast({
        title: "Failed to load organization",
        description: error instanceof Error ? error.message : "Could not load organization data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!user?.organization_id) return;
    
    setIsLoadingMembers(true);
    try {
      const data = await organizationsApi.listMembers(user.organization_id);
      setMembers(data.members);
    } catch (error) {
      toast({
        title: "Failed to load members",
        description: error instanceof Error ? error.message : "Could not load organization members",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (activeTab === "members" && user?.organization_id) {
      loadMembers();
    }
  }, [activeTab, user?.organization_id]);

  const handleInvite = async () => {
    if (!user?.organization_id || !inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      const request: InviteMemberRequest = {
        email: inviteEmail.trim(),
        role: inviteRole,
      };
      await organizationsApi.inviteMember(user.organization_id, request);
      toast({
        title: "Member invited",
        description: `${inviteEmail} has been invited to the organization.`,
      });
      setInviteEmail("");
      setInviteRole("analyst");
      setIsInviteDialogOpen(false);
      loadMembers();
    } catch (error) {
      toast({
        title: "Invite failed",
        description: error instanceof Error ? error.message : "Could not invite member",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!user?.organization_id) return;
    
    if (!confirm(`Are you sure you want to remove ${memberName} from the organization?`)) {
      return;
    }
    
    try {
      await organizationsApi.removeMember(user.organization_id, userId);
      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the organization.`,
      });
      loadMembers();
    } catch (error) {
      toast({
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Could not remove member",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: "admin" | "analyst" | "viewer") => {
    if (!user?.organization_id) return;
    
    try {
      const request: UpdateMemberRoleRequest = { role: newRole };
      await organizationsApi.updateMemberRole(user.organization_id, userId, request);
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
      loadMembers();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-2.5 w-2.5" />;
      case "analyst":
        return <User className="h-2.5 w-2.5" />;
      case "viewer":
        return <Eye className="h-2.5 w-2.5" />;
      default:
        return <User className="h-2.5 w-2.5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "analyst":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
  };

  const isAdmin = user?.is_superuser || false;

  const handleOrganizationUpdate = async (updates: UpdateOrganizationRequest) => {
    if (!organization || !user?.organization_id) return;
    
    setIsSaving(true);
    try {
      const updated = await organizationsApi.update(user.organization_id, updates);
      setOrganization(updated);
      toast({
        title: "Organization updated",
        description: "Your organization settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update organization",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingsUpdate = async (updates: UpdateOrganizationSettingsRequest) => {
    if (!settings || !user?.organization_id) return;
    
    setIsSaving(true);
    try {
      const updated = await organizationsApi.updateSettings(user.organization_id, updates);
      setSettings(updated);
      toast({
        title: "Settings updated",
        description: "Your organization settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGlobalSearch = (query: string) => {
    toast({
      title: "Search",
      description: `Searching for "${query}" across documents and projects...`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <GlobalNavBar onSearch={handleGlobalSearch} />
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
            <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!organization || !settings) {
    return null;
  }

  const tabs = [
    { id: "general" as const, label: "General", icon: Building2 },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "members" as const, label: "Members", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <GlobalNavBar onSearch={handleGlobalSearch} />
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-transparent via-transparent to-[#f5f5f5]/50 dark:to-[#0f0f0f]/50">
          <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-12">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-medium tracking-tight text-[#171717] dark:text-[#fafafa] mb-1.5">
                    Organization Settings
                  </h1>
                  <p className="text-sm text-[#737373] dark:text-[#a3a3a3] font-normal">
                    Manage your organization settings and preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="mb-6">
              <div className="flex items-center gap-0.5 border-b border-[#e5e5e5] dark:border-[#262626]">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                      }}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors duration-200",
                        "border-b-2 -mb-px",
                        isActive
                          ? "text-[#171717] dark:text-[#fafafa] border-[#171717] dark:border-[#fafafa]"
                          : "text-[#737373] dark:text-[#a3a3a3] border-transparent hover:text-[#171717] dark:hover:text-[#fafafa]"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
              {activeTab === "general" && (
                <Card className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                  <CardHeader className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <CardTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">General Settings</CardTitle>
                    <CardDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">Manage your organization's basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="org-name" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Organization Name</Label>
                      <div className="space-y-1">
                        <Input
                          id="org-name"
                          value={organization.name}
                          onChange={(e) => {
                            const newName = e.target.value;
                            setOrganization({ ...organization, name: newName });
                          }}
                          onBlur={() => {
                            if (organization.name.trim()) {
                              handleOrganizationUpdate({ name: organization.name });
                            }
                          }}
                          disabled={isSaving}
                          className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-slug" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Organization Slug</Label>
                      <div className="space-y-1">
                        <Input
                          id="org-slug"
                          value={organization.slug}
                          disabled
                          className="h-8 text-xs bg-[#fafafa] dark:bg-[#0a0a0a] border-[#e5e5e5] dark:border-[#262626]"
                        />
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          The slug is automatically generated and cannot be changed
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-plan" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Plan</Label>
                      <div className="space-y-1">
                        <Select
                          value={organization.plan}
                          onValueChange={(value) => {
                            handleOrganizationUpdate({ plan: value as "free" | "pro" | "enterprise" });
                          }}
                          disabled={isSaving}
                        >
                          <SelectTrigger id="org-plan" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                            <SelectItem value="free" className="text-xs">Free</SelectItem>
                            <SelectItem value="pro" className="text-xs">Pro</SelectItem>
                            <SelectItem value="enterprise" className="text-xs">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <Card className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                  <CardHeader className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <CardTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Security Settings</CardTitle>
                    <CardDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">Configure security policies for your organization</CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between py-1">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="require-2fa" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Require Two-Factor Authentication</Label>
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          Enforce 2FA for all organization members
                        </p>
                      </div>
                      <Switch
                        id="require-2fa"
                        checked={settings.require2fa}
                        onCheckedChange={(checked) => {
                          handleSettingsUpdate({ require2fa: checked });
                        }}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <div className="space-y-0.5 flex-1">
                        <Label htmlFor="allow-guest" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Allow Guest Access</Label>
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          Allow guests to access shared documents
                        </p>
                      </div>
                      <Switch
                        id="allow-guest"
                        checked={settings.allowGuestAccess}
                        onCheckedChange={(checked) => {
                          handleSettingsUpdate({ allowGuestAccess: checked });
                        }}
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="data-retention" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Data Retention (days)</Label>
                      <div className="space-y-1">
                        <Input
                          id="data-retention"
                          type="number"
                          min="1"
                          max="3650"
                          value={settings.dataRetentionDays || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setSettings({ ...settings, dataRetentionDays: value });
                          }}
                          onBlur={() => {
                            handleSettingsUpdate({ dataRetentionDays: settings.dataRetentionDays });
                          }}
                          disabled={isSaving}
                          placeholder="No limit"
                          className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
                        />
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          Documents will be automatically deleted after this many days (leave empty for no limit)
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="max-users" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Maximum Users</Label>
                      <div className="space-y-1">
                        <Input
                          id="max-users"
                          type="number"
                          min="1"
                          value={settings.maxUsers || ""}
                          onChange={(e) => {
                            const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                            setSettings({ ...settings, maxUsers: value });
                          }}
                          onBlur={() => {
                            handleSettingsUpdate({ maxUsers: settings.maxUsers });
                          }}
                          disabled={isSaving}
                          placeholder="No limit"
                          className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
                        />
                        <p className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">
                          Maximum number of users allowed in the organization (leave empty for no limit)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "members" && (
                <Card className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                  <CardHeader className="px-5 py-4 border-b border-[#e5e5e5] dark:border-[#262626]">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Organization Members</CardTitle>
                        <CardDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                          {members.length} {members.length === 1 ? "member" : "members"} in your organization
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="h-7 text-xs bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]">
                              <UserPlus className="h-3 w-3 mr-1.5" />
                              Invite Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                            <div className="px-4 pt-4 pb-3 border-b border-[#e5e5e5] dark:border-[#262626]">
                              <DialogHeader>
                                <DialogTitle className="text-sm font-medium text-[#171717] dark:text-[#fafafa]">Invite Member</DialogTitle>
                                <DialogDescription className="text-xs text-[#737373] dark:text-[#a3a3a3] mt-0.5">
                                  Invite a user to join your organization. The user must already have an account.
                                </DialogDescription>
                              </DialogHeader>
                            </div>
                            <div className="px-4 py-4 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]">
                              <div className="space-y-1.5">
                                <Label htmlFor="invite-email" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Email Address</Label>
                                <div className="space-y-1">
                                  <Input
                                    id="invite-email"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label htmlFor="invite-role" className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">Role</Label>
                                <div className="space-y-1">
                                  <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "admin" | "analyst" | "viewer")}>
                                    <SelectTrigger id="invite-role" className="h-8 text-xs border-[#e5e5e5] dark:border-[#262626]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                                      <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                                      <SelectItem value="analyst" className="text-xs">Analyst</SelectItem>
                                      <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-3 border-t border-[#e5e5e5] dark:border-[#262626] bg-[#fafafa] dark:bg-[#0a0a0a] flex items-center justify-end gap-2">
                              <Button variant="ghost" onClick={() => setIsInviteDialogOpen(false)} className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                                Cancel
                              </Button>
                              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()} className="h-7 text-xs min-w-[90px] bg-[#171717] dark:bg-[#fafafa] text-[#fafafa] dark:text-[#171717] hover:bg-[#262626] dark:hover:bg-[#e5e5e5]">
                                {isInviting ? (
                                  <>
                                    <span className="mr-1.5 h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    Inviting...
                                  </>
                                ) : (
                                  "Invite"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-5">
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#e5e5e5] dark:border-[#262626] hover:bg-transparent">
                            <TableHead className="text-xs font-medium text-[#171717] dark:text-[#fafafa] h-8">Member</TableHead>
                            <TableHead className="text-xs font-medium text-[#171717] dark:text-[#fafafa] h-8">Email</TableHead>
                            <TableHead className="text-xs font-medium text-[#171717] dark:text-[#fafafa] h-8">Role</TableHead>
                            <TableHead className="text-xs font-medium text-[#171717] dark:text-[#fafafa] h-8">Joined</TableHead>
                            {isAdmin && <TableHead className="text-right text-xs font-medium text-[#171717] dark:text-[#fafafa] h-8">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.length === 0 ? (
                            <TableRow className="border-[#e5e5e5] dark:border-[#262626] hover:bg-transparent">
                              <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-6 text-xs text-[#737373] dark:text-[#a3a3a3]">
                                No members found
                              </TableCell>
                            </TableRow>
                          ) : (
                            members.map((member) => (
                              <TableRow key={member.userId} className="border-[#e5e5e5] dark:border-[#262626] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                                <TableCell className="py-2.5">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage src={undefined} />
                                      <AvatarFallback className="text-[10px] bg-[#fafafa] dark:bg-[#0a0a0a] text-[#171717] dark:text-[#fafafa]">
                                        {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-xs font-medium text-[#171717] dark:text-[#fafafa]">{member.name}</div>
                                      {isCurrentUser(member.userId) && (
                                        <span className="text-[10px] text-[#737373] dark:text-[#a3a3a3]">(You)</span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-[#171717] dark:text-[#fafafa]">{member.email}</TableCell>
                                <TableCell className="py-2.5">
                                  <Badge className={cn("text-[10px] font-normal px-1.5 py-0.5", getRoleColor(member.role))}>
                                    <span className="flex items-center gap-1">
                                      {getRoleIcon(member.role)}
                                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2.5 text-xs text-[#737373] dark:text-[#a3a3a3]">
                                  {new Date(member.joinedAt).toLocaleDateString()}
                                </TableCell>
                                {isAdmin && (
                                  <TableCell className="text-right py-2.5">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs text-[#737373] dark:text-[#a3a3a3] hover:text-[#171717] dark:hover:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]">
                                          Actions
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#171717]">
                                        {!isCurrentUser(member.userId) && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "admin")}
                                              disabled={member.role === "admin"}
                                              className="text-xs px-2.5 py-2 text-[#171717] dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                                            >
                                              Set as Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "analyst")}
                                              disabled={member.role === "analyst"}
                                              className="text-xs px-2.5 py-2 text-[#171717] dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                                            >
                                              Set as Analyst
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "viewer")}
                                              disabled={member.role === "viewer"}
                                              className="text-xs px-2.5 py-2 text-[#171717] dark:text-[#fafafa] hover:bg-[#fafafa] dark:hover:bg-[#0a0a0a]"
                                            >
                                              Set as Viewer
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleRemoveMember(member.userId, member.name)}
                                              className="text-xs px-2.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                              <Trash2 className="h-3 w-3 mr-1.5" />
                                              Remove
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        {isCurrentUser(member.userId) && (
                                          <DropdownMenuItem disabled className="text-xs px-2.5 py-2 text-[#737373] dark:text-[#a3a3a3]">
                                            Cannot modify your own role
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

