import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Edit, Trash2, Search, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAllRedirects, deleteRedirect, updateRedirect } from "@/db/api";
import type { Redirect } from "@/types";
import RedirectForm from "@/components/admin/seo/RedirectForm";

export default function RedirectManagement() {
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [filteredRedirects, setFilteredRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRedirect, setEditingRedirect] = useState<Redirect | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRedirects();
  }, []);

  useEffect(() => {
    filterRedirects();
  }, [searchQuery, redirects]);

  const loadRedirects = async () => {
    try {
      setLoading(true);
      const data = await getAllRedirects();
      setRedirects(data);
    } catch (error) {
      console.error("加载重定向规则失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载重定向规则，请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRedirects = () => {
    if (!searchQuery.trim()) {
      setFilteredRedirects(redirects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = redirects.filter(
      (redirect) =>
        redirect.from_path.toLowerCase().includes(query) ||
        redirect.to_path.toLowerCase().includes(query)
    );
    setFilteredRedirects(filtered);
  };

  const handleAdd = () => {
    setEditingRedirect(null);
    setIsFormOpen(true);
  };

  const handleEdit = (redirect: Redirect) => {
    setEditingRedirect(redirect);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个重定向规则吗？")) {
      return;
    }

    try {
      const success = await deleteRedirect(id);
      if (success) {
        toast({
          title: "删除成功",
          description: "重定向规则已删除",
        });
        loadRedirects();
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      console.error("删除重定向规则失败:", error);
      toast({
        title: "删除失败",
        description: "无法删除重定向规则，请重试",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (redirect: Redirect) => {
    try {
      const success = await updateRedirect(redirect.id, {
        is_active: !redirect.is_active,
      });
      
      if (success) {
        toast({
          title: redirect.is_active ? "已禁用" : "已启用",
          description: `重定向规则已${redirect.is_active ? '禁用' : '启用'}`,
        });
        loadRedirects();
      } else {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.error("更新重定向规则失败:", error);
      toast({
        title: "更新失败",
        description: "无法更新重定向规则，请重试",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingRedirect(null);
    loadRedirects();
  };

  const getRedirectTypeBadge = (type: number) => {
    const config = {
      301: { label: "301 永久", variant: "default" as const },
      302: { label: "302 临时", variant: "secondary" as const },
      307: { label: "307 临时", variant: "secondary" as const },
      308: { label: "308 永久", variant: "default" as const },
    };
    const { label, variant } = config[type as keyof typeof config] || { label: String(type), variant: "outline" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <>
      <Helmet>
        <title>URL Redirect Management - Admin Panel</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">URL Redirect Management</h1>
            <p className="text-muted-foreground mt-2">
              管理 URL 重定向规则，支持 301、302、307、308 重定向类型
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加重定向规则
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>重定向规则列表</CardTitle>
            <CardDescription>
              共 {redirects.length} 条重定向规则，其中 {redirects.filter(r => r.is_active).length} 条已启用
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索源路径或目标路径..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 表格 */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredRedirects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? "没有找到匹配的重定向规则" : "还没有配置任何重定向规则"}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>源路径</TableHead>
                        <TableHead>目标路径</TableHead>
                        <TableHead>重定向类型</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRedirects.map((redirect) => (
                        <TableRow key={redirect.id}>
                          <TableCell className="font-mono text-sm">
                            {redirect.from_path}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {redirect.to_path}
                          </TableCell>
                          <TableCell>
                            {getRedirectTypeBadge(redirect.redirect_type)}
                          </TableCell>
                          <TableCell>
                            {redirect.is_active ? (
                              <Badge variant="default">已启用</Badge>
                            ) : (
                              <Badge variant="outline">已禁用</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(redirect)}
                                title={redirect.is_active ? "禁用" : "启用"}
                              >
                                {redirect.is_active ? (
                                  <PowerOff className="h-4 w-4" />
                                ) : (
                                  <Power className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(redirect)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(redirect.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 重定向类型说明 */}
        <Card>
          <CardHeader>
            <CardTitle>重定向类型说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">301 永久重定向</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  告诉搜索引擎页面已永久移动到新位置，会传递 SEO 权重
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">302 临时重定向</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  告诉搜索引擎页面临时移动，不会传递 SEO 权重
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">307 临时重定向</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  类似 302，但保证不改变 HTTP 请求方法（如 POST）
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">308 永久重定向</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  类似 301，但保证不改变 HTTP 请求方法（如 POST）
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 添加/编辑表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRedirect ? "编辑重定向规则" : "添加重定向规则"}
            </DialogTitle>
            <DialogDescription>
              配置 URL 重定向规则，将旧的 URL 重定向到新的 URL
            </DialogDescription>
          </DialogHeader>
          <RedirectForm
            redirect={editingRedirect}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
