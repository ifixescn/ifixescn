import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getModuleSetting, updateModuleSetting } from "@/db/api";
import ImageUpload from "@/components/common/ImageUpload";
import { Package, Save, Image as ImageIcon } from "lucide-react";
import type { ModuleSetting, ModuleSettingFormData } from "@/types";

export default function ProductSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ModuleSetting | null>(null);
  const [formData, setFormData] = useState<ModuleSettingFormData>({
    display_name: "Products",
    banner_image: null,
    seo_title: "",
    seo_keywords: "",
    seo_description: "",
    is_enabled: true,
    sort_order: 0,
    items_per_page: 12,
    show_author: false,
    show_date: true,
    show_category: true,
    allow_comments: false,
    custom_settings: {}
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getModuleSetting("products");
      if (data) {
        setSettings(data);
        setFormData({
          display_name: data.display_name,
          banner_image: data.banner_image,
          seo_title: data.seo_title,
          seo_keywords: data.seo_keywords,
          seo_description: data.seo_description,
          is_enabled: data.is_enabled,
          sort_order: data.sort_order,
          items_per_page: data.items_per_page,
          show_author: data.show_author,
          show_date: data.show_date,
          show_category: data.show_category,
          allow_comments: data.allow_comments,
          custom_settings: data.custom_settings
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Loading failed",
        description: "Failed to load product module settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateModuleSetting("products", formData);
      toast({
        title: "Saved successfully",
        description: "Product module settings updated"
      });
      loadSettings();
      // 触发自定义事件通知HeaderComponentRefreshSettings
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("SaveSettingsFailed:", error);
      toast({
        title: "Save failed",
        description: "Failed to save product module settings",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Package className="h-8 w-8" />
          ProductsModule Settings
        </h1>
        <p className="text-muted-foreground">配置Products模块的ShowName、栏目Image、SEO Settings等</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本Settings</CardTitle>
            <CardDescription>配置Products模块的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">模块ShowName *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="例如：Products、服务、解决方案"
                required
              />
              <p className="text-sm text-muted-foreground">
                此Name将在前端导航栏和Page Title中Show
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable模块</Label>
                <p className="text-sm text-muted-foreground">
                  Close后，Products模块将在前端Hide
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                数字越小，在导航栏中的位置越靠前
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              栏目Image
            </CardTitle>
            <CardDescription>UploadProducts模块的栏目横幅Image</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.banner_image || ""}
              onChange={(url) => setFormData({ ...formData, banner_image: url })}
              onRemove={() => setFormData({ ...formData, banner_image: null })}
            />
            <p className="text-sm text-muted-foreground mt-2">
              建议尺寸：1200x400 像素，支持 JPG、PNG Format
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>优化Product ListPage的Search引擎表现</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ""}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Products展示 - Site Name"
              />
              <p className="text-sm text-muted-foreground">
                Show在Search引擎结果和浏览器TagsPage中
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ""}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="Products,服务,解决方案"
              />
              <p className="text-sm text-muted-foreground">
                多个Keywords用英文逗号分隔
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ""}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="View我们的Products和服务，Found适合您的解决方案"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Show在Search引擎结果中，建议 120-160 字符
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ShowSettings</CardTitle>
            <CardDescription>配置Product List和DetailPage的Show选项</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="items_per_page">per pageShowCount</Label>
              <Input
                id="items_per_page"
                type="number"
                min="1"
                max="100"
                value={formData.items_per_page}
                onChange={(e) => setFormData({ ...formData, items_per_page: parseInt(e.target.value) || 12 })}
              />
              <p className="text-sm text-muted-foreground">
                Product Listper pageShow的ProductsCount
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ShowAuthor</Label>
                <p className="text-sm text-muted-foreground">
                  在Product List和DetailPageShow发布者信息
                </p>
              </div>
              <Switch
                checked={formData.show_author}
                onCheckedChange={(checked) => setFormData({ ...formData, show_author: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ShowDate</Label>
                <p className="text-sm text-muted-foreground">
                  在Product List和DetailPageShow发布Date
                </p>
              </div>
              <Switch
                checked={formData.show_date}
                onCheckedChange={(checked) => setFormData({ ...formData, show_date: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>ShowCategory</Label>
                <p className="text-sm text-muted-foreground">
                  在Product List和DetailPageShowCategoryTags
                </p>
              </div>
              <Switch
                checked={formData.show_category}
                onCheckedChange={(checked) => setFormData({ ...formData, show_category: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>允许评论</Label>
                <p className="text-sm text-muted-foreground">
                  开启后，User可以在Product DetailPage发表评论（功能待开发）
                </p>
              </div>
              <Switch
                checked={formData.allow_comments}
                onCheckedChange={(checked) => setFormData({ ...formData, allow_comments: checked })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={loadSettings}>
            Reset
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Save中..." : "SaveSettings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
