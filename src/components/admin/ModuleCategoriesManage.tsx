import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/db/api";
import ImageUpload from "@/components/common/ImageUpload";
import type { Category } from "@/types";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ModuleCategoriesManageProps {
  moduleType: "article" | "product" | "question" | "download" | "video";
}

export default function ModuleCategoriesManage({ moduleType }: ModuleCategoriesManageProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formIcon, setFormIcon] = useState<string>("");
  const [formBannerImage, setFormBannerImage] = useState<string>("");
  
  // Add form status
  const [isEnabled, setIsEnabled] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showCategory, setShowCategory] = useState(true);
  
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getCategories(moduleType);
      setCategories(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const seo_title = formData.get("seo_title") as string;
    const seo_keywords = formData.get("seo_keywords") as string;
    const seo_description = formData.get("seo_description") as string;
    const items_per_page = parseInt(formData.get("items_per_page") as string) || 12;
    const sort_order = parseInt(formData.get("sort_order") as string) || 0;

    try {
      const categoryData = {
        name,
        slug,
        description: description || null,
        seo_title: seo_title || null,
        seo_keywords: seo_keywords || null,
        seo_description: seo_description || null,
        banner_image: formBannerImage || null,
        icon: formIcon || null,
        items_per_page,
        sort_order,
        is_enabled: isEnabled,
        show_author: showAuthor,
        show_date: showDate,
        show_category: showCategory
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        toast({ title: "Success", description: "Category updated" });
      } else {
        await createCategory({ ...categoryData, type: moduleType });
        toast({ title: "Success", description: "Category created" });
      }
      setDialogOpen(false);
      setEditingCategory(null);
      setFormIcon("");
      setFormBannerImage("");
      loadData();
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await deleteCategory(id);
      toast({ title: "Success", description: "Category deleted" });
      loadData();
      window.dispatchEvent(new Event("categoriesUpdated"));
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const openDialog = (category?: Category) => {
    setEditingCategory(category || null);
    setFormIcon(category?.icon || "");
    setFormBannerImage(category?.banner_image || "");
    setIsEnabled(category?.is_enabled ?? true);
    setShowAuthor(category?.show_author ?? true);
    setShowDate(category?.show_date ?? true);
    setShowCategory(category?.show_category ?? true);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {categories.length} categories
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>别名</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Order</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  NoCategory数据
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-center">{category.sort_order}</TableCell>
                  <TableCell className="text-center">
                    {category.is_enabled ? (
                      <Badge variant="default">Enable</Badge>
                    ) : (
                      <Badge variant="secondary">Disable</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              填写Category信息，带 * 的为Required field
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingCategory?.name}
                  required
                  placeholder="Please enterCategory Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">别名 *</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingCategory?.slug}
                  required
                  placeholder="用于URL，如：news"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={editingCategory?.description || ""}
                placeholder="Please enterCategory Description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sort_order">Order</Label>
                <Input
                  id="sort_order"
                  name="sort_order"
                  type="number"
                  defaultValue={editingCategory?.sort_order || 0}
                  placeholder="数字越小越靠前"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="items_per_page">per pageShowCount</Label>
                <Input
                  id="items_per_page"
                  name="items_per_page"
                  type="number"
                  defaultValue={editingCategory?.items_per_page || 12}
                  placeholder="默认12"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>EnableStatus</Label>
                  <p className="text-sm text-muted-foreground">
                    Disable后前端将不Show此Category
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={setIsEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ShowAuthor</Label>
                  <p className="text-sm text-muted-foreground">
                    在列表和DetailPageShowAuthor信息
                  </p>
                </div>
                <Switch
                  checked={showAuthor}
                  onCheckedChange={setShowAuthor}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ShowDate</Label>
                  <p className="text-sm text-muted-foreground">
                    在列表和DetailPageShow发布Date
                  </p>
                </div>
                <Switch
                  checked={showDate}
                  onCheckedChange={setShowDate}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>ShowCategory</Label>
                  <p className="text-sm text-muted-foreground">
                    在列表和DetailPageShowCategoryTags
                  </p>
                </div>
                <Switch
                  checked={showCategory}
                  onCheckedChange={setShowCategory}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CategoryIcon</Label>
              <ImageUpload
                value={formIcon}
                onChange={setFormIcon}
              />
            </div>

            <div className="space-y-2">
              <Label>横幅Image</Label>
              <ImageUpload
                value={formBannerImage}
                onChange={setFormBannerImage}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">SEO Settings</h3>
              
              <div className="space-y-2">
                <Label htmlFor="seo_title">SEOTitle</Label>
                <Input
                  id="seo_title"
                  name="seo_title"
                  defaultValue={editingCategory?.seo_title || ""}
                  placeholder="Search引擎Show的Title"
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
                  placeholder="Search引擎Show的Description"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
