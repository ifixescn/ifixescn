import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSiteSettings, updateSiteSetting, uploadLogo, deleteLogo } from "@/db/api";
import type { SiteSetting } from "@/types";
import { Save, Upload, X, Image as ImageIcon } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadingHeroIcon, setUploadingHeroIcon] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [heroIconPreview, setHeroIconPreview] = useState<string>("");
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const data = await getSiteSettings();
      const settingsMap: Record<string, string> = {};
      data.forEach((setting: SiteSetting) => {
        settingsMap[setting.key] = setting.value || "";
      });
      setSettings(settingsMap);
      setLogoPreview(settingsMap.site_logo || "");
      setHeroIconPreview(settingsMap.home_hero_icon || "");
      setLoading(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "Error", 
        description: "Only PNG, JPG, SVG and WebP format images are supported", 
        variant: "destructive" 
      });
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1048576) {
      toast({ 
        title: "Error", 
        description: "ImageSize不能超过 1MB", 
        variant: "destructive" 
      });
      return;
    }

    setUploading(true);
    try {
      // 如果已有LOGO，先Delete旧的
      if (logoPreview) {
        try {
          await deleteLogo(logoPreview);
        } catch (error) {
          console.error("Delete旧LOGOFailed:", error);
        }
      }

      // Upload新LOGO
      const url = await uploadLogo(file);
      
      // Update数据库
      await updateSiteSetting("site_logo", url);
      
      setLogoPreview(url);
      setSettings({ ...settings, site_logo: url });
      
      toast({ title: "Success", description: "LOGO已Upload" });
      
      // 触发自定义事件通知HeaderComponentRefresh
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("UploadLOGOFailed:", error);
      toast({ title: "Error", description: "UploadLOGOFailed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!logoPreview) return;

    try {
      await deleteLogo(logoPreview);
      await updateSiteSetting("site_logo", "");
      
      setLogoPreview("");
      setSettings({ ...settings, site_logo: "" });
      
      toast({ title: "Success", description: "LOGO已Delete" });
      
      // 触发自定义事件通知HeaderComponentRefresh
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("DeleteLOGOFailed:", error);
      toast({ title: "Error", description: "DeleteLOGOFailed", variant: "destructive" });
    }
  };

  const handleHeroIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: "错误", 
        description: "仅支持PNG、JPG、SVG和WebP格式的图片", 
        variant: "destructive" 
      });
      return;
    }

    // 验证文件大小 (2MB)
    if (file.size > 2097152) {
      toast({ 
        title: "错误", 
        description: "图片大小不能超过2MB", 
        variant: "destructive" 
      });
      return;
    }

    setUploadingHeroIcon(true);
    try {
      // 如果已有图标，先删除旧的
      if (heroIconPreview) {
        try {
          await deleteLogo(heroIconPreview);
        } catch (error) {
          console.error("删除旧图标失败:", error);
        }
      }

      // 上传新图标
      const url = await uploadLogo(file);
      
      // 更新数据库
      await updateSiteSetting("home_hero_icon", url);
      
      setHeroIconPreview(url);
      setSettings({ ...settings, home_hero_icon: url });
      
      toast({ title: "成功", description: "首页图标已上传" });
      
      // 触发自定义事件通知页面刷新
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("上传图标失败:", error);
      toast({ title: "错误", description: "上传图标失败", variant: "destructive" });
    } finally {
      setUploadingHeroIcon(false);
    }
  };

  const handleHeroIconDelete = async () => {
    if (!heroIconPreview) return;

    try {
      await deleteLogo(heroIconPreview);
      await updateSiteSetting("home_hero_icon", "");
      
      setHeroIconPreview("");
      setSettings({ ...settings, home_hero_icon: "" });
      
      toast({ title: "成功", description: "首页图标已删除" });
      
      // 触发自定义事件通知页面刷新
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("删除图标失败:", error);
      toast({ title: "错误", description: "删除图标失败", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const updates = [
      { key: "site_name", value: formData.get("site_name") as string },
      { key: "site_description", value: formData.get("site_description") as string },
      { key: "site_keywords", value: formData.get("site_keywords") as string },
      { key: "contact_email", value: formData.get("contact_email") as string },
      { key: "contact_phone", value: formData.get("contact_phone") as string }
    ];

    try {
      for (const update of updates) {
        await updateSiteSetting(update.key, update.value);
      }
      toast({ title: "Success", description: "Site Settings已Update" });
      loadData();
      // 触发自定义事件通知HeaderComponentRefreshSettings
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("Save failed:", error);
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
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
      <h1 className="text-3xl font-bold">Site Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>配置网站的基本信息和SEO Settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name *</Label>
              <Input
                id="site_name"
                name="site_name"
                defaultValue={settings.site_name || "iFixes"}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea
                id="site_description"
                name="site_description"
                defaultValue={settings.site_description || ""}
                rows={3}
                placeholder="用于SEO优化的Site Description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_keywords">Site Keywords</Label>
              <Input
                id="site_keywords"
                name="site_keywords"
                defaultValue={settings.site_keywords || ""}
                placeholder="Keywords1, Keywords2, Keywords3"
              />
            </div>
            <div className="space-y-2">
              <Label>网站LOGO</Label>
              <div className="space-y-4">
                {logoPreview && (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="网站LOGOPreview" 
                      className="h-16 w-auto max-w-[300px] object-contain border border-border rounded-lg p-2 bg-muted"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={handleLogoDelete}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="logo-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={uploading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {uploading ? "Uploading..." : logoPreview ? "更换LOGO" : "UploadLOGO"}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    建议尺寸：高度40px，宽度自适应（最大200px）。支持PNG、JPG、SVG、WebPFormat，最大1MB
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Info</CardTitle>
            <CardDescription>配置网站的联系信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                type="email"
                defaultValue={settings.contact_email || ""}
                placeholder="contact@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                defaultValue={settings.contact_phone || ""}
                placeholder="400-xxx-xxxx"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            SaveSettings
          </Button>
        </div>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>首页设置</CardTitle>
          <CardDescription>配置首页Hero区域的视觉元素</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hero区域图标/图片</Label>
            <div className="space-y-4">
              {heroIconPreview && (
                <div className="relative inline-block">
                  <img 
                    src={heroIconPreview} 
                    alt="首页图标预览" 
                    className="h-32 w-32 object-contain border border-border rounded-lg p-4 bg-muted"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleHeroIconDelete}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="hero-icon-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                  onChange={handleHeroIconUpload}
                  disabled={uploadingHeroIcon}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('hero-icon-upload')?.click()}
                  disabled={uploadingHeroIcon}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {uploadingHeroIcon ? "上传中..." : heroIconPreview ? "更换图标" : "上传图标"}
                </Button>
                <p className="text-sm text-muted-foreground">
                  推荐尺寸：192x192px或更大。支持PNG、JPG、SVG、WebP格式，最大2MB。留空则使用默认图标。
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>系统信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">系统Version:</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">技术栈:</span>
              <span className="font-medium">React + TypeScript + Supabase</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
