import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/db/api";
import ImageUpload from "@/components/common/ImageUpload";
import type { Category } from "@/types";
import { Pencil, Trash2, Plus, FolderOpen } from "lucide-react";

export default function CategoriesManage() {
  const [articleCategories, setArticleCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [downloadCategories, setDownloadCategories] = useState<Category[]>([]);
  const [videoCategories, setVideoCategories] = useState<Category[]>([]);
  const [questionCategories, setQuestionCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentType, setCurrentType] = useState<"article" | "product" | "download" | "video" | "question">("article");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [articles, products, downloads, videos, questions] = await Promise.all([
        getCategories("article"),
        getCategories("product"),
        getCategories("download"),
        getCategories("video"),
        getCategories("question")
      ]);
      setArticleCategories(articles);
      setProductCategories(products);
      setDownloadCategories(downloads);
      setVideoCategories(videos);
      setQuestionCategories(questions);
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
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const type = formData.get("type") as "article" | "product" | "download" | "video" | "question";
    const seo_title = formData.get("seo_title") as string;
    const seo_keywords = formData.get("seo_keywords") as string;
    const seo_description = formData.get("seo_description") as string;
    const banner_image = formData.get("banner_image") as string;
    const icon = formData.get("icon") as string;
    const items_per_page = parseInt(formData.get("items_per_page") as string) || 12;
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;
    const is_enabled = formData.get("is_enabled") === "true";
    const show_author = formData.get("show_author") === "true";
    const show_date = formData.get("show_date") === "true";
    const show_category = formData.get("show_category") === "true";

    try {
      const categoryData = {
        name,
        slug,
        description: description || null,
        seo_title: seo_title || null,
        seo_keywords: seo_keywords || null,
        seo_description: seo_description || null,
        banner_image: banner_image || null,
        icon: icon || null,
        items_per_page,
        sort_order,
        is_enabled,
        show_author,
        show_date,
        show_category
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast({ title: "Success", description: "Category updated" });
      } else {
        await createCategory({ ...categoryData, type });
        toast({ title: "Success", description: "Category created" });
      }
      setDialogOpen(false);
      setEditingCategory(null);
      loadData();
      // 触发自定义事件通知HeaderComponentRefreshCategory
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category? Related content will become uncategorized.")) return;
    
    try {
      await deleteCategory(id);
      toast({ title: "Success", description: "Category deleted" });
      loadData();
      // 触发自定义事件通知HeaderComponentRefreshCategory
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const openCreateDialog = (type: "article" | "product" | "download" | "video" | "question") => {
    setEditingCategory(null);
    setCurrentType(type);
    setDialogOpen(true);
  };

  const renderCategoryList = (categories: Category[], typeName: string, typeValue: "article" | "product" | "download" | "video" | "question") => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{typeName}分类 ({categories.length})</CardTitle>
          <Button onClick={() => openCreateDialog(typeValue)}>
            <Plus className="h-4 w-4 mr-2" />
            新建Category
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {categories.map(category => (
            <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-5 w-5 text-primary" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant="outline">{category.slug}</Badge>
                  </div>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              NoCategory,点击上方按钮Create第一categories
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
        <h1 className="text-3xl font-bold">Category Management</h1>
      </div>

      <Tabs defaultValue="article" className="space-y-6">
        <TabsList>
          <TabsTrigger value="article">Article Category</TabsTrigger>
          <TabsTrigger value="product">Product Category</TabsTrigger>
          <TabsTrigger value="download">DownloadCategory</TabsTrigger>
          <TabsTrigger value="video">Video Category</TabsTrigger>
          <TabsTrigger value="question">Q&ACategory</TabsTrigger>
        </TabsList>

        <TabsContent value="article">
          {renderCategoryList(articleCategories, "Articles", "article")}
        </TabsContent>

        <TabsContent value="product">
          {renderCategoryList(productCategories, "Products", "product")}
        </TabsContent>

        <TabsContent value="download">
          {renderCategoryList(downloadCategories, "Download", "download")}
        </TabsContent>

        <TabsContent value="video">
          {renderCategoryList(videoCategories, "Videos", "video")}
        </TabsContent>

        <TabsContent value="question">
          {renderCategoryList(questionCategories, "Q&A", "question")}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "新建Category"}</DialogTitle>
            <DialogDescription>
              填写Category信息，包括基本信息、SEO Settings和Show选项
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">基本信息</TabsTrigger>
                <TabsTrigger value="seo">SEO Settings</TabsTrigger>
                <TabsTrigger value="display">Show选项</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={editingCategory?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL别名 *</Label>
                  <Input
                    id="slug"
                    name="slug"
                    defaultValue={editingCategory?.slug}
                    placeholder="例如: technology"
                    required
                  />
                </div>
                {!editingCategory && (
                  <div className="space-y-2">
                    <Label htmlFor="type">Category Type *</Label>
                    <Select name="type" defaultValue={currentType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="article">Article Category</SelectItem>
                        <SelectItem value="product">Product Category</SelectItem>
                        <SelectItem value="download">DownloadCategory</SelectItem>
                        <SelectItem value="video">Video Category</SelectItem>
                        <SelectItem value="question">Q&ACategory</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingCategory?.description || ""}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="banner_image">横幅ImageURL</Label>
                  <ImageUpload
                    value={editingCategory?.banner_image || ""}
                    onChange={(url) => {
                      const input = document.getElementById("banner_image") as HTMLInputElement;
                      if (input) input.value = url;
                    }}
                  />
                  <Input
                    id="banner_image"
                    name="banner_image"
                    type="hidden"
                    defaultValue={editingCategory?.banner_image || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">IconURL</Label>
                  <Input
                    id="icon"
                    name="icon"
                    defaultValue={editingCategory?.icon || ""}
                    placeholder="CategoryIconURL"
                  />
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="seo_title">SEOTitle</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    defaultValue={editingCategory?.seo_title || ""}
                    placeholder="留空则使用Category Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_keywords">SEOKeywords</Label>
                  <Input
                    id="seo_keywords"
                    name="seo_keywords"
                    defaultValue={editingCategory?.seo_keywords || ""}
                    placeholder="多个Keywords用逗号分隔"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo_description">SEODescription</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    defaultValue={editingCategory?.seo_description || ""}
                    placeholder="留空则使用Category Description"
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="display" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="items_per_page">per pageShowCount</Label>
                  <Input
                    id="items_per_page"
                    name="items_per_page"
                    type="number"
                    min="1"
                    max="100"
                    defaultValue={editingCategory?.items_per_page || 12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Order顺序</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingCategory?.sort_order || 0}
                    placeholder="数字越小越靠前"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="is_enabled">EnableCategory</Label>
                  <input
                    type="hidden"
                    name="is_enabled"
                    value={editingCategory?.is_enabled !== false ? "true" : "false"}
                  />
                  <Switch
                    id="is_enabled"
                    defaultChecked={editingCategory?.is_enabled !== false}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector('input[name="is_enabled"]') as HTMLInputElement;
                      if (input) input.value = checked ? "true" : "false";
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show_author">ShowAuthor</Label>
                  <input
                    type="hidden"
                    name="show_author"
                    value={editingCategory?.show_author !== false ? "true" : "false"}
                  />
                  <Switch
                    id="show_author"
                    defaultChecked={editingCategory?.show_author !== false}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector('input[name="show_author"]') as HTMLInputElement;
                      if (input) input.value = checked ? "true" : "false";
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show_date">ShowDate</Label>
                  <input
                    type="hidden"
                    name="show_date"
                    value={editingCategory?.show_date !== false ? "true" : "false"}
                  />
                  <Switch
                    id="show_date"
                    defaultChecked={editingCategory?.show_date !== false}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector('input[name="show_date"]') as HTMLInputElement;
                      if (input) input.value = checked ? "true" : "false";
                    }}
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="show_category">ShowCategory</Label>
                  <input
                    type="hidden"
                    name="show_category"
                    value={editingCategory?.show_category !== false ? "true" : "false"}
                  />
                  <Switch
                    id="show_category"
                    defaultChecked={editingCategory?.show_category !== false}
                    onCheckedChange={(checked) => {
                      const input = document.querySelector('input[name="show_category"]') as HTMLInputElement;
                      if (input) input.value = checked ? "true" : "false";
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
