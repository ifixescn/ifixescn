import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Edit, Trash2, Search } from "lucide-react";
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
import { getAllPageSEO, deletePageSEO } from "@/db/api";
import type { PageSEO } from "@/types";
import PageSEOForm from "@/components/admin/seo/PageSEOForm";

export default function PageSEOManagement() {
  const [pages, setPages] = useState<PageSEO[]>([]);
  const [filteredPages, setFilteredPages] = useState<PageSEO[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageSEO | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    filterPages();
  }, [searchQuery, pages]);

  const loadPages = async () => {
    try {
      setLoading(true);
      const data = await getAllPageSEO();
      setPages(data);
    } catch (error) {
      console.error("加载页面 SEO 设置失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载页面 SEO 设置，请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterPages = () => {
    if (!searchQuery.trim()) {
      setFilteredPages(pages);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = pages.filter(
      (page) =>
        page.page_path.toLowerCase().includes(query) ||
        page.page_title?.toLowerCase().includes(query) ||
        page.page_description?.toLowerCase().includes(query)
    );
    setFilteredPages(filtered);
  };

  const handleAdd = () => {
    setEditingPage(null);
    setIsFormOpen(true);
  };

  const handleEdit = (page: PageSEO) => {
    setEditingPage(page);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个页面的 SEO 设置吗？")) {
      return;
    }

    try {
      const success = await deletePageSEO(id);
      if (success) {
        toast({
          title: "删除成功",
          description: "页面 SEO 设置已删除",
        });
        loadPages();
      } else {
        throw new Error("删除失败");
      }
    } catch (error) {
      console.error("删除页面 SEO 设置失败:", error);
      toast({
        title: "删除失败",
        description: "无法删除页面 SEO 设置，请重试",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingPage(null);
    loadPages();
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 0.8) {
      return <Badge variant="default">高</Badge>;
    } else if (priority >= 0.5) {
      return <Badge variant="secondary">中</Badge>;
    } else {
      return <Badge variant="outline">低</Badge>;
    }
  };

  const getFrequencyText = (frequency: string) => {
    const map: Record<string, string> = {
      always: "总是",
      hourly: "每小时",
      daily: "每天",
      weekly: "每周",
      monthly: "每月",
      yearly: "每年",
      never: "从不",
    };
    return map[frequency] || frequency;
  };

  return (
    <>
      <Helmet>
        <title>Page SEO Management - Admin Panel</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Page SEO Management</h1>
            <p className="text-muted-foreground mt-2">
              管理各个页面的 SEO 设置，包括标题、描述、关键词等
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            添加页面 SEO
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>页面列表</CardTitle>
            <CardDescription>
              共 {pages.length} 个页面已配置 SEO 设置
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索页面路径、标题或描述..."
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
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery ? "没有找到匹配的页面" : "还没有配置任何页面的 SEO 设置"}
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>页面路径</TableHead>
                        <TableHead>页面标题</TableHead>
                        <TableHead>优先级</TableHead>
                        <TableHead>更新频率</TableHead>
                        <TableHead>索引状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPages.map((page) => (
                        <TableRow key={page.id}>
                          <TableCell className="font-mono text-sm">
                            {page.page_path}
                          </TableCell>
                          <TableCell>
                            {page.page_title || (
                              <span className="text-muted-foreground">未设置</span>
                            )}
                          </TableCell>
                          <TableCell>{getPriorityBadge(page.priority)}</TableCell>
                          <TableCell>{getFrequencyText(page.change_frequency)}</TableCell>
                          <TableCell>
                            {page.noindex ? (
                              <Badge variant="destructive">禁止索引</Badge>
                            ) : (
                              <Badge variant="default">允许索引</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(page)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(page.id)}
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
      </div>

      {/* 添加/编辑表单对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPage ? "编辑页面 SEO" : "添加页面 SEO"}
            </DialogTitle>
            <DialogDescription>
              配置页面的 SEO 信息，包括标题、描述、关键词和社交媒体标签
            </DialogDescription>
          </DialogHeader>
          <PageSEOForm
            page={editingPage}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
