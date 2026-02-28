import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getArticles, getCategories, createArticle, updateArticle, deleteArticle, getCurrentUser } from "@/db/api";
import type { ArticleWithAuthor, Category, ContentStatus } from "@/types";
import { Pencil, Trash2, Plus, Eye } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import ImageUpload from "@/components/common/ImageUpload";

export default function ArticlesManage() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleWithAuthor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [formContent, setFormContent] = useState("");
  const [formCoverImage, setFormCoverImage] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [articlesData, categoriesData] = await Promise.all([
        getArticles(1, 100),
        getCategories("article")
      ]);
      setArticles(articlesData.articles);
      setCategories(categoriesData);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const excerpt = formData.get("excerpt") as string;
    const category_id = formData.get("category_id") as string;
    const status = formData.get("status") as ContentStatus;

    // Validate content is not empty
    if (!formContent.trim()) {
      toast({ title: "Error", description: "Content cannot be empty", variant: "destructive" });
      return;
    }

    try {
      if (editingArticle) {
        await updateArticle(editingArticle.id, {
          title,
          slug,
          content: formContent,
          excerpt,
          cover_image: formCoverImage || undefined,
          category_id: category_id === "none" ? undefined : category_id,
          status
        });
        toast({ title: "Success", description: "Article updated" });
      } else {
        const user = await getCurrentUser();
        if (!user) {
          toast({ title: "Error", description: "Please login first", variant: "destructive" });
          return;
        }
        await createArticle({
          title,
          slug,
          content: formContent,
          excerpt,
          cover_image: formCoverImage || undefined,
          category_id: category_id === "none" ? undefined : category_id,
          status,
          author_id: user.id
        });
        toast({ title: "Success", description: "Article created" });
      }
      setDialogOpen(false);
      setEditingArticle(null);
      setFormContent("");
      setFormCoverImage("");
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("OK要Delete这篇Articles吗?")) return;
    
    try {
      await deleteArticle(id);
      toast({ title: "Success", description: "Articles已Delete" });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const toggleSelectArticle = (id: string) => {
    const newSelected = new Set(selectedArticles);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedArticles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedArticles.size === filteredArticles.length) {
      setSelectedArticles(new Set());
    } else {
      setSelectedArticles(new Set(filteredArticles.map(a => a.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedArticles.size === 0) {
      toast({ title: "Notice", description: "请先选择要Delete的Articles" });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedArticles.size} 篇Articles吗?`)) return;

    try {
      await Promise.all(Array.from(selectedArticles).map(id => deleteArticle(id)));
      toast({ title: "Success", description: `已删除 ${selectedArticles.size} 篇Articles` });
      setSelectedArticles(new Set());
      loadData();
    } catch (error) {
      console.error("批量Delete failed:", error);
      toast({ title: "Error", description: "批量Delete failed", variant: "destructive" });
    }
  };

  const openEditDialog = (article: ArticleWithAuthor) => {
    setEditingArticle(article);
    setFormContent(article.content);
    setFormCoverImage(article.cover_image || "");
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingArticle(null);
    setFormContent("");
    setFormCoverImage("");
    setDialogOpen(true);
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || article.status === filterStatus;
    const matchesCategory = filterCategory === "all" || 
                           (filterCategory === "none" ? !article.category_id : article.category_id === filterCategory);
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
        <h1 className="text-3xl font-bold">Article Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新建Articles
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "新建Articles"}</DialogTitle>
              <DialogDescription>
                填写Articles信息,支持HTMLFormat的Content
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingArticle?.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL别名 *</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingArticle?.slug}
                  placeholder="例如: my-first-article"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editingArticle?.category_id || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Summary</Label>
                <Textarea
                  id="excerpt"
                  name="excerpt"
                  defaultValue={editingArticle?.excerpt || ""}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>封面Image</Label>
                <ImageUpload
                  value={formCoverImage}
                  onChange={setFormCoverImage}
                />
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <RichTextEditor
                  value={formContent}
                  onChange={setFormContent}
                  placeholder="Please enterArticle Content..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editingArticle?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingArticle ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter和Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="SearchTitle或别名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">AllStatus</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">AllCategory</SelectItem>
                  <SelectItem value="none">无Category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statistics</Label>
              <div className="text-sm text-muted-foreground pt-2">
                共 {filteredArticles.length} 篇Articles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Articles列表 ({filteredArticles.length})</CardTitle>
            {selectedArticles.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">已选择 {selectedArticles.size} 篇</span>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                  Batch Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredArticles.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedArticles.size === filteredArticles.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
            {filteredArticles.map(article => (
              <div key={article.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  checked={selectedArticles.has(article.id)}
                  onCheckedChange={() => toggleSelectArticle(article.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{article.title}</h3>
                    <Badge variant={
                      article.status === "published" ? "default" :
                      article.status === "draft" ? "secondary" : "outline"
                    }>
                      {article.status === "published" ? "Published" :
                       article.status === "draft" ? "Draft" : "Offline"}
                    </Badge>
                    {article.category && (
                      <Badge variant="outline">{article.category.name}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    作者: {article.author?.username || "未知"} | 
                    浏览: {article.view_count} | 
                    创建: {new Date(article.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(article)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(article.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredArticles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all" 
                  ? "没有Found符合条件的Articles" 
                  : "No articles available,点击上方按钮Create第一篇Articles"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
