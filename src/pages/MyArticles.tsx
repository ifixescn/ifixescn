import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, getProfile, getArticlesByAuthor, getCategories, createArticle, updateArticle, deleteArticle } from "@/db/api";
import type { ArticleWithAuthor, Category, Profile } from "@/types";
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";

export default function MyArticles() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleWithAuthor | null>(null);
  const [formContent, setFormContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({ title: "Error", description: "Please login first", variant: "destructive" });
        return;
      }

      const [profileData, articlesData, categoriesData] = await Promise.all([
        getProfile(user.id),
        getArticlesByAuthor(user.id),
        getCategories("article")
      ]);

      setProfile(profileData);
      setArticles(Array.isArray(articlesData) ? articlesData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const excerpt = formData.get("excerpt") as string;
    const cover_image = formData.get("cover_image") as string;
    const category_id = formData.get("category_id") as string;

    if (!formContent.trim()) {
      toast({ title: "Error", description: "Article content cannot be empty", variant: "destructive" });
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({ title: "Error", description: "Please login first", variant: "destructive" });
        return;
      }

      const articleData = {
        title,
        slug,
        content: formContent,
        excerpt: excerpt || null,
        cover_image: cover_image || null,
        category_id: category_id === "none" ? null : category_id,
        author_id: user.id,
        status: "pending" as const
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, articleData);
        toast({ 
          title: "Success", 
          description: "Your submission has been received and is pending administrator approval. Thank you for your support!" 
        });
      } else {
        await createArticle(articleData);
        toast({ 
          title: "Success", 
          description: "Your submission has been received and is pending administrator approval. Thank you for your support!" 
        });
      }

      setDialogOpen(false);
      setEditingArticle(null);
      setFormContent("");
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Save failed",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;

    try {
      await deleteArticle(id);
      toast({ title: "Success", description: "Article deleted" });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const openEditDialog = (article: ArticleWithAuthor) => {
    setEditingArticle(article);
    setFormContent(article.content || "");
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingArticle(null);
    setFormContent("");
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pending", variant: "secondary" as const },
      published: { label: "Published", variant: "default" as const },
      offline: { label: "Offline", variant: "destructive" as const },
      draft: { label: "Draft", variant: "outline" as const }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMemberLevelBadge = (level: string) => {
    const levelMap = {
      guest: { label: "Guest", variant: "outline" as const },
      member: { label: "Member", variant: "secondary" as const },
      premium: { label: "Premium Member", variant: "default" as const },
      svip: { label: "SVIP Member", variant: "destructive" as const }
    };
    const config = levelMap[level as keyof typeof levelMap] || levelMap.member;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Submissions</h1>
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Member等级：</span>
                {getMemberLevelBadge(profile.member_level)}
              </div>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                投稿Articles
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingArticle ? "Edit Article" : "投稿Articles"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">ArticlesTitle *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingArticle?.title || ""}
                    placeholder="Please enterArticlesTitle"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL标识 *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingArticle?.slug || ""}
                    placeholder="article-slug"
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
                  <Label htmlFor="excerpt">ArticlesExcerpt</Label>
                  <Input
                    id="excerpt"
                    name="excerpt"
                    defaultValue={editingArticle?.excerpt || ""}
                    placeholder="Please enterArticlesExcerpt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image">Cover Image片URL</Label>
                  <Input
                    id="cover_image"
                    name="cover_image"
                    defaultValue={editingArticle?.cover_image || ""}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ArticlesContent *</Label>
                  <RichTextEditor
                    value={formContent}
                    onChange={setFormContent}
                    placeholder="Please enterArticlesContent..."
                  />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📝 投稿说明：ArticlesSubmit后将进入PendingStatus，AdminApproved successfully后才会在网站上Show。
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingArticle ? "Update" : "Submit"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {articles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">还没有投稿Articles</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                开始投稿
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {articles.map(article => (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{article.title}</CardTitle>
                        {getStatusBadge(article.status)}
                      </div>
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {article.category && (
                          <span>Category: {article.category.name}</span>
                        )}
                        <span>Created: {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {article.published_at && (
                          <span>Published: {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(article)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
