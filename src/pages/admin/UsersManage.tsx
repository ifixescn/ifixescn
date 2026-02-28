import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAllProfiles, updateUserRole } from "@/db/api";
import type { Profile } from "@/types";
import { Shield, User as UserIcon } from "lucide-react";

export default function UsersManage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getAllProfiles();
      setUsers(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast({ title: "Success", description: "User role updated" });
      loadData();
    } catch (error) {
      console.error("Update failed:", error);
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "editor":
        return <Badge variant="secondary">Edit</Badge>;
      case "member":
        return <Badge variant="outline">Member</Badge>;
      default:
        return <Badge variant="outline">Guest</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Admin: {users.filter(u => u.role === "admin").length}
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Total Users: {users.length}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4 flex-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.username || "未SettingsUsername"}</h3>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email && <span>邮箱: {user.email}</span>}
                      {user.phone && <span> | 手机: {user.phone}</span>}
                      <span> | 注册: {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Edit</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="visitor">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                NoUser
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Badge variant="default">Admin</Badge>
              <span className="text-muted-foreground">拥有系统All权限,可Management所有Content和User</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary">Edit</Badge>
              <span className="text-muted-foreground">可发布和ManagementContent,审核Q&A,但不能ManagementUser</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">Member</Badge>
              <span className="text-muted-foreground">可Ask Question、Answer Question,ViewPublishedContent</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="outline">Guest</Badge>
              <span className="text-muted-foreground">只能浏览公开Content</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
