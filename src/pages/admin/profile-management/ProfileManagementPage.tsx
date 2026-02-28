import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getAllProfilesForAdmin,
  adminToggleProfileVisibility,
  getProfileManagementLogs,
} from "@/db/api";
import { Profile, ProfileVisibility, ProfileManagementLog } from "@/types";
import { Loader2, Eye, Users, Lock, Settings, History, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function ProfileManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showVisibilityDialog, setShowVisibilityDialog] = useState(false);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [logs, setLogs] = useState<ProfileManagementLog[]>([]);
  const [newVisibility, setNewVisibility] = useState<ProfileVisibility>("public");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadProfiles();
  }, [user, navigate, page]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const result = await getAllProfilesForAdmin(page, 20);
      setProfiles(result.profiles);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (profileId: string) => {
    try {
      const result = await getProfileManagementLogs(profileId, 1, 50);
      setLogs(result.logs);
    } catch (error) {
      console.error("Failed to load management logs:", error);
      toast({
        title: "Error",
        description: "Failed to load management logs",
        variant: "destructive",
      });
    }
  };

  const handleChangeVisibility = async () => {
    if (!selectedProfile || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      await adminToggleProfileVisibility(selectedProfile.id, newVisibility, reason);
      toast({
        title: "Success",
        description: "Profile visibility updated successfully",
      });
      setShowVisibilityDialog(false);
      setReason("");
      loadProfiles();
    } catch (error) {
      console.error("Failed to update visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update visibility",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getVisibilityBadge = (visibility: ProfileVisibility) => {
    const config = {
      public: { label: "Public", variant: "default" as const, icon: Eye },
      friends: { label: "Friends Only", variant: "secondary" as const, icon: Users },
      private: { label: "Private", variant: "destructive" as const, icon: Lock },
    };
    const { label, variant, icon: Icon } = config[visibility];
    return (
      <Badge variant={variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getMemberLevelBadge = (level: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      bronze: { label: "Bronze", variant: "secondary" },
      silver: { label: "Silver", variant: "default" },
      gold: { label: "Gold", variant: "default" },
      member: { label: "会员", variant: "secondary" },
      premium: { label: "高级会员", variant: "default" },
      svip: { label: "SVIP", variant: "default" },
    };
    const { label, variant } = config[level] || { label: level, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Profile Management</h1>
        <p className="text-muted-foreground">
          Manage all member profile settings and access permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profile List</CardTitle>
              <CardDescription>共 {total} 个会员主页</CardDescription>
            </div>
            <Input
              placeholder="Search by username, nickname or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Member Level</TableHead>
                <TableHead>Email Verified</TableHead>
                <TableHead>Profile Visibility</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.username || ""}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-medium">
                            {(profile.username || profile.nickname || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {profile.username || profile.nickname || "未设置"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {profile.email || "No Email"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getMemberLevelBadge(profile.member_level)}</TableCell>
                  <TableCell>
                    {profile.email_verified ? (
                      <Badge variant="default">已验证</Badge>
                    ) : (
                      <Badge variant="secondary">未验证</Badge>
                    )}
                  </TableCell>
                  <TableCell>{getVisibilityBadge(profile.profile_visibility)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(profile.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(profile);
                          setNewVisibility(profile.profile_visibility);
                          setShowVisibilityDialog(true);
                        }}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProfile(profile);
                          loadLogs(profile.id);
                          setShowLogsDialog(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No matching profiles found
            </div>
          )}

          {/* 分页 */}
          {total > 20 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} 页，共 {Math.ceil(total / 20)} 页
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Visibility Dialog */}
      <Dialog open={showVisibilityDialog} onOpenChange={setShowVisibilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改个人Profile Visibility</DialogTitle>
            <DialogDescription>
              修改 {selectedProfile?.username || selectedProfile?.nickname} 的个人Profile Visibility设置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>可见性</Label>
              <Select
                value={newVisibility}
                onValueChange={(value: ProfileVisibility) => setNewVisibility(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Friends Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actions原因 *</Label>
              <Textarea
                placeholder="请输入修改原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisibilityDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangeVisibility} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Management Logs对话框 */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Management Logs</DialogTitle>
            <DialogDescription>
              Management history for {selectedProfile?.username || selectedProfile?.nickname}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No management logs
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), {
                          addSuffix: true,
                          locale: zhCN,
                        })}
                      </div>
                    </div>
                    {log.reason && (
                      <div className="text-sm text-muted-foreground mb-2">
                        原因：{log.reason}
                      </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                      Actions人：{log.admin?.username || log.admin?.nickname || "系统"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
