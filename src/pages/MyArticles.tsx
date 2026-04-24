import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageMeta from "@/components/common/PageMeta";
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
import { useTranslation } from "@/contexts/TranslationContext";

export default function MyArticles() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<ArticleWithAuthor | null>(null);
  const [formContent, setFormContent] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({ title: t("auth.error", "Error"), description: t("member.loginFirst", "Please login first"), variant: "destructive" });
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
      toast({ title: t("auth.error", "Error"), description: t("member.loadFailed", "Failed to load data"), variant: "destructive" });
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
      toast({ title: t("auth.error", "Error"), description: t("member.articleContentEmpty", "Article content cannot be empty"), variant: "destructive" });
      return;
    }

    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({ title: t("auth.error", "Error"), description: t("member.loginFirst", "Please login first"), variant: "destructive" });
        return;
      }

      const articleData = {
        title,
        slug,
        content: formContent,
        excerpt: excerpt || undefined,
        cover_image: cover_image || undefined,
        category_id: category_id === "none" ? undefined : category_id,
        author_id: user.id,
        status: "pending" as const
      };

      if (editingArticle) {
        await updateArticle(editingArticle.id, articleData);
        toast({ 
          title: t("auth.success", "Success"), 
          description: t("member.submissionReceived", "Your submission has been received and is pending administrator approval. Thank you for your support!") 
        });
      } else {
        await createArticle(articleData);
        toast({ 
          title: t("auth.success", "Success"), 
          description: t("member.submissionReceived", "Your submission has been received and is pending administrator approval. Thank you for your support!") 
        });
      }

      setDialogOpen(false);
      setEditingArticle(null);
      setFormContent("");
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: t("auth.error", "Error"),
        description: error instanceof Error ? error.message : t("member.saveFailed", "Save failed"),
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("member.confirmDeleteArticle", "Are you sure you want to delete this article?"))) return;

    try {
      await deleteArticle(id);
      toast({ title: t("auth.success", "Success"), description: t("member.articleDeleted", "Article deleted") });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: t("auth.error", "Error"), description: t("member.deleteFailed", "Delete failed"), variant: "destructive" });
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
      pending: { label: t("member.statusPending", "Pending"), variant: "secondary" as const },
      published: { label: t("member.statusPublished", "Published"), variant: "default" as const },
      offline: { label: t("member.statusOffline", "Offline"), variant: "destructive" as const },
      draft: { label: t("member.statusDraft", "Draft"), variant: "outline" as const }
    };
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMemberLevelBadge = (level: string) => {
    const levelMap = {
      guest: { label: t("member.levelGuest", "Guest"), variant: "outline" as const },
      member: { label: t("member.levelMember", "Member"), variant: "secondary" as const },
      premium: { label: t("member.levelPremium", "Premium Member"), variant: "default" as const },
      svip: { label: t("member.levelSvip", "SVIP Member"), variant: "destructive" as const }
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
      <PageMeta title="My Submissions" noIndex={true} />
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t("member.mySubmissions", "My Submissions")}</h1>
            {profile && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("member.memberLevel", "Member Level")}：</span>
                {getMemberLevelBadge(profile.member_level)}
              </div>
            )}
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t("member.submitArticle", "Submit Article")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingArticle ? t("member.editArticle", "Edit Article") : t("member.submitArticle", "Submit Article")}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("member.articleTitle", "Article Title")} *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingArticle?.title || ""}
                    placeholder={t("member.enterArticleTitle", "Please enter article title")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">{t("member.urlSlug", "URL Slug")} *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingArticle?.slug || ""}
                    placeholder="article-slug"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">{t("member.category", "Category")}</Label>
                  <Select name="category_id" defaultValue={editingArticle?.category_id || "none"}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("member.selectCategory", "Select Category")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("member.noCategory", "No Category")}</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">{t("member.articleExcerpt", "Article Excerpt")}</Label>
                  <Input
                    id="excerpt"
                    name="excerpt"
                    defaultValue={editingArticle?.excerpt || ""}
                    placeholder={t("member.enterExcerpt", "Please enter article excerpt")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cover_image">{t("member.coverImageUrl", "Cover Image URL")}</Label>
                  <Input
                    id="cover_image"
                    name="cover_image"
                    defaultValue={editingArticle?.cover_image || ""}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("member.articleContent", "Article Content")} *</Label>
                  <RichTextEditor
                    value={formContent}
                    onChange={setFormContent}
                    placeholder={t("member.enterContent", "Please enter article content...")}
                  />
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    📝 {t("member.submissionNote", "Submitted articles will be pending review. They will appear on the site after administrator approval.")}
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    {t("member.cancel", "Cancel")}
                  </Button>
                  <Button type="submit">
                    {editingArticle ? t("member.update", "Update") : t("member.submit", "Submit")}
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
              <p className="text-muted-foreground mb-4">{t("member.noArticlesYet", "No articles submitted yet")}</p>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                {t("member.startSubmitting", "Start Submitting")}
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
                          <span>{t("member.category", "Category")}: {article.category.name}</span>
                        )}
                        <span>{t("member.created", "Created")}: {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        {article.published_at && (
                          <span>{t("member.published", "Published")}: {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
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
