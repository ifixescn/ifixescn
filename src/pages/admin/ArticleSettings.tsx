import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getModuleSetting, updateModuleSetting } from "@/db/api";
import ImageUpload from "@/components/common/ImageUpload";
import { FileText, Save, Image as ImageIcon, Power } from "lucide-react";
import type { ModuleSettingFormData } from "@/types";

export default function ArticleSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [formData, setFormData] = useState<ModuleSettingFormData>({
    display_name: "Articles",
    banner_image: null,
    seo_title: "",
    seo_keywords: "",
    seo_description: "",
    is_enabled: true,
    sort_order: 0,
    items_per_page: 12,
    show_author: true,
    show_date: true,
    show_category: true,
    allow_comments: false,
    custom_settings: {}
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getModuleSetting("articles");
      if (data) {
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
      toast.error("加载失败", { description: "无法加载文章模块设置" });
    } finally {
      setLoading(false);
    }
  };

  // 模块开关：单独保存，立即生效
  const handleToggleModule = async (enabled: boolean) => {
    setToggling(true);
    try {
      await updateModuleSetting("articles", { ...formData, is_enabled: enabled });
      setFormData((prev) => ({ ...prev, is_enabled: enabled }));
      // 广播设置变更，Header 等组件立即响应
      window.dispatchEvent(new Event("settingsUpdated"));
      toast.success(enabled ? "文章模块已开启" : "文章模块已关闭", {
        description: enabled
          ? "前端文章入口和页面已恢复显示"
          : "前端文章入口和页面已隐藏，后台数据完整保留",
      });
    } catch (error) {
      console.error("Toggle module failed:", error);
      toast.error("操作失败", { description: "模块状态切换失败，请重试" });
    } finally {
      setToggling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateModuleSetting("articles", formData);
      toast.success("保存成功", { description: "文章模块设置已更新" });
      loadSettings();
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("SaveSettingsFailed:", error);
      toast.error("保存失败", { description: "无法保存文章模块设置" });
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
          <FileText className="h-8 w-8" />
          Article Module Settings
        </h1>
        <p className="text-muted-foreground">配置文章模块的前端显示、SEO 及展示选项</p>
      </div>

      {/* ── 模块开关（置顶，独立保存，立即生效）── */}
      <Card className={formData.is_enabled ? "border-border" : "border-destructive/40 bg-destructive/5"}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${formData.is_enabled ? "bg-primary/10" : "bg-muted"}`}>
                <Power className={`h-5 w-5 ${formData.is_enabled ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  前端模块开关
                  <Badge variant={formData.is_enabled ? "default" : "secondary"}>
                    {formData.is_enabled ? "已开启" : "已关闭"}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-0.5">
                  {formData.is_enabled
                    ? "文章模块当前在前端正常显示，包括导航入口、列表页、详情页"
                    : "文章模块已关闭：前端导航入口和所有文章页面已隐藏，后台数据完整保留"}
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={formData.is_enabled}
              disabled={toggling}
              onCheckedChange={handleToggleModule}
              className="shrink-0"
            />
          </div>
        </CardHeader>
        {!formData.is_enabled && (
          <CardContent className="pt-0">
            <div className="text-sm text-muted-foreground bg-muted rounded-md px-4 py-3">
              <strong>关闭状态说明：</strong>前端导航栏文章入口已隐藏；访问文章相关 URL 将自动跳转到首页；后台文章数据、抓取任务、翻译等内容完整保留，随时可重新开启。
            </div>
          </CardContent>
        )}
      </Card>

      {/* ── 其余设置表单 ── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本设置</CardTitle>
            <CardDescription>配置文章模块的显示名称和顺序</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">模块显示名称 *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="例如：Articles、博客、资讯"
                required
              />
              <p className="text-sm text-muted-foreground">此名称将显示在前端导航栏和页面标题中</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort_order">排列顺序</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">数字越小，在导航栏中的位置越靠前</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              栏目横幅图片
            </CardTitle>
            <CardDescription>上传文章模块的栏目横幅图片</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.banner_image || ""}
              onChange={(url) => setFormData({ ...formData, banner_image: url })}
              onRemove={() => setFormData({ ...formData, banner_image: null })}
            />
            <p className="text-sm text-muted-foreground mt-2">建议尺寸：1200x400 像素，支持 JPG、PNG 格式</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO 设置</CardTitle>
            <CardDescription>优化文章列表页的搜索引擎表现</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO 标题</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ""}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="文章列表 - 网站名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO 关键词</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ""}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="文章,博客,资讯,内容"
              />
              <p className="text-sm text-muted-foreground">多个关键词用英文逗号分隔</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO 描述</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ""}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="浏览我们的文章列表，获取最新资讯和深度内容"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">建议 120–160 字符</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>展示设置</CardTitle>
            <CardDescription>配置文章列表和详情页的展示选项</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="items_per_page">每页显示数量</Label>
              <Input
                id="items_per_page"
                type="number"
                min="1"
                max="100"
                value={formData.items_per_page}
                onChange={(e) => setFormData({ ...formData, items_per_page: parseInt(e.target.value) || 12 })}
              />
            </div>

            {(
              [
                { key: "show_author", label: "显示作者", desc: "在文章列表和详情页显示作者信息" },
                { key: "show_date", label: "显示日期", desc: "在文章列表和详情页显示发布日期" },
                { key: "show_category", label: "显示分类", desc: "在文章列表和详情页显示分类标签" },
                { key: "allow_comments", label: "允许评论", desc: "开启后，用户可在文章详情页发表评论（功能待开发）" },
              ] as const
            ).map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{label}</Label>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={formData[key] as boolean}
                  onCheckedChange={(checked) => setFormData({ ...formData, [key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={loadSettings}>
            重置
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </form>
    </div>
  );
}

