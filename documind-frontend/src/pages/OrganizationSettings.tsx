import { useState, useEffect } from "react";
import { GlobalNavBar } from "@/components/layout/GlobalNavBar";
import { organizationsApi } from "@/services/api";
import type { Organization, OrganizationSettings, UpdateOrganizationRequest, UpdateOrganizationSettingsRequest, OrganizationMember, InviteMemberRequest, UpdateMemberRoleRequest } from "@/types/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Shield, Users, UserPlus, Trash2, User, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
  const [activeTab, setActiveTab] = useState<"general" | "security" | "members">("general");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "analyst" | "viewer">("analyst");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

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
        return <Shield className="h-4 w-4" />;
      case "analyst":
        return <User className="h-4 w-4" />;
      case "viewer":
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
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
            <div className="mb-10 lg:mb-12">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[#171717] dark:text-[#fafafa] mb-3">
                    Organization Settings
                  </h1>
                  <p className="text-[15px] text-[#737373] dark:text-[#a3a3a3] font-normal">
                    Manage your organization settings and preferences
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Tabs Navigation */}
            <div className="mb-8">
              <div className="flex items-center gap-1 border-b border-[#e5e5e5] dark:border-[#262626]">
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
                        "relative flex items-center gap-2.5 px-5 py-3.5 text-[15px] font-medium transition-colors duration-200",
                        "border-b-2 -mb-px",
                        isActive
                          ? "text-[#171717] dark:text-[#fafafa] border-[#171717] dark:border-[#fafafa]"
                          : "text-[#737373] dark:text-[#a3a3a3] border-transparent hover:text-[#171717] dark:hover:text-[#fafafa]"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "general" && (
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>Manage your organization's basic information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name</Label>
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-slug">Organization Slug</Label>
                      <Input
                        id="org-slug"
                        value={organization.slug}
                        disabled
                        className="bg-[#f5f5f5] dark:bg-[#171717]"
                      />
                      <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
                        The slug is automatically generated and cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-plan">Plan</Label>
                      <Select
                        value={organization.plan}
                        onValueChange={(value) => {
                          handleOrganizationUpdate({ plan: value as "free" | "pro" | "enterprise" });
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="org-plan">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure security policies for your organization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="require-2fa">Require Two-Factor Authentication</Label>
                        <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
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
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allow-guest">Allow Guest Access</Label>
                        <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
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
                    <div className="space-y-2">
                      <Label htmlFor="data-retention">Data Retention (days)</Label>
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
                      />
                      <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
                        Documents will be automatically deleted after this many days (leave empty for no limit)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-users">Maximum Users</Label>
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
                      />
                      <p className="text-sm text-[#737373] dark:text-[#a3a3a3]">
                        Maximum number of users allowed in the organization (leave empty for no limit)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "members" && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Organization Members</CardTitle>
                        <CardDescription>
                          {members.length} {members.length === 1 ? "member" : "members"} in your organization
                        </CardDescription>
                      </div>
                      {isAdmin && (
                        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Invite Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Invite Member</DialogTitle>
                              <DialogDescription>
                                Invite a user to join your organization. The user must already have an account.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="invite-email">Email Address</Label>
                                <Input
                                  id="invite-email"
                                  type="email"
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="user@example.com"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as "admin" | "analyst" | "viewer")}>
                                  <SelectTrigger id="invite-role">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="analyst">Analyst</SelectItem>
                                    <SelectItem value="viewer">Viewer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleInvite} disabled={isInviting || !inviteEmail.trim()}>
                                {isInviting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Inviting...
                                  </>
                                ) : (
                                  "Invite"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMembers ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#737373] dark:text-[#a3a3a3]" />
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-[#737373] dark:text-[#a3a3a3]">
                                No members found
                              </TableCell>
                            </TableRow>
                          ) : (
                            members.map((member) => (
                              <TableRow key={member.userId}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={undefined} />
                                      <AvatarFallback>
                                        {member.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">{member.name}</div>
                                      {isCurrentUser(member.userId) && (
                                        <span className="text-xs text-[#737373] dark:text-[#a3a3a3]">(You)</span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                  <Badge className={getRoleColor(member.role)}>
                                    <span className="flex items-center gap-1">
                                      {getRoleIcon(member.role)}
                                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                    </span>
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {new Date(member.joinedAt).toLocaleDateString()}
                                </TableCell>
                                {isAdmin && (
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          Actions
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {!isCurrentUser(member.userId) && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "admin")}
                                              disabled={member.role === "admin"}
                                            >
                                              Set as Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "analyst")}
                                              disabled={member.role === "analyst"}
                                            >
                                              Set as Analyst
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleUpdateRole(member.userId, "viewer")}
                                              disabled={member.role === "viewer"}
                                            >
                                              Set as Viewer
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleRemoveMember(member.userId, member.name)}
                                              className="text-red-600 dark:text-red-400"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </>
                                        )}
                                        {isCurrentUser(member.userId) && (
                                          <DropdownMenuItem disabled>
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

