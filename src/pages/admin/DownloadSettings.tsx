import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getModuleSetting, updateModuleSetting } from "@/db/api";
import type { ModuleSetting } from "@/types";

export default function DownloadSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ModuleSetting>({
    id: "",
    module_type: "download",
    display_name: "Download Center",
    banner_image: "",
    seo_title: "",
    seo_keywords: "",
    seo_description: "",
    is_enabled: true,
    sort_order: 3,
    items_per_page: 12,
    show_author: true,
    show_date: true,
    show_category: true,
    allow_comments: false,
    custom_settings: { require_login_to_download: false },
    updated_at: "",
    created_at: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getModuleSetting("download");
      if (data) {
        setSettings({
          ...data,
          custom_settings: data.custom_settings || { require_login_to_download: false }
        });
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Loading failed",
        description: "Failed to load download module settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateModuleSetting("download", {
        display_name: settings.display_name,
        banner_image: settings.banner_image,
        seo_title: settings.seo_title,
        seo_keywords: settings.seo_keywords,
        seo_description: settings.seo_description,
        is_enabled: settings.is_enabled,
        sort_order: settings.sort_order,
        items_per_page: settings.items_per_page,
        show_author: settings.show_author,
        show_date: settings.show_date,
        show_category: settings.show_category,
        allow_comments: settings.allow_comments,
        custom_settings: settings.custom_settings
      });

      toast({
        title: "Saved successfully",
        description: "Download module settings updated",
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "Failed to save settings, please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">DownloadModule Settings</h1>
        <p className="text-muted-foreground mt-2">
          配置Download Center的Show和功能Settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">ShowName</Label>
            <Input
              id="display_name"
              value={settings.display_name}
              onChange={(e) =>
                setSettings({ ...settings, display_name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner_image">横幅ImageURL</Label>
            <Input
              id="banner_image"
              value={settings.banner_image || ""}
              onChange={(e) =>
                setSettings({ ...settings, banner_image: e.target.value })
              }
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable模块</Label>
              <p className="text-sm text-muted-foreground">
                YesNo在网站上ShowDownload Center
              </p>
            </div>
            <Switch
              checked={settings.is_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, is_enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seo_title">SEOTitle</Label>
            <Input
              id="seo_title"
              value={settings.seo_title || ""}
              onChange={(e) =>
                setSettings({ ...settings, seo_title: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_keywords">SEOKeywords</Label>
            <Input
              id="seo_keywords"
              value={settings.seo_keywords || ""}
              onChange={(e) =>
                setSettings({ ...settings, seo_keywords: e.target.value })
              }
              placeholder="Keywords1, Keywords2, Keywords3"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seo_description">SEODescription</Label>
            <Textarea
              id="seo_description"
              value={settings.seo_description || ""}
              onChange={(e) =>
                setSettings({ ...settings, seo_description: e.target.value })
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ShowSettings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="items_per_page">per pageShowCount</Label>
            <Input
              id="items_per_page"
              type="number"
              min="1"
              value={settings.items_per_page}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  items_per_page: parseInt(e.target.value) || 12,
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ShowAuthor</Label>
              <p className="text-sm text-muted-foreground">
                在列表中ShowUpload者信息
              </p>
            </div>
            <Switch
              checked={settings.show_author}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_author: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ShowDate</Label>
              <p className="text-sm text-muted-foreground">
                在列表中ShowUploadDate
              </p>
            </div>
            <Switch
              checked={settings.show_date}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_date: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>ShowCategory</Label>
              <p className="text-sm text-muted-foreground">
                在列表中ShowCategoryTags
              </p>
            </div>
            <Switch
              checked={settings.show_category}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, show_category: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>权限Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Login Required才能Download</Label>
              <p className="text-sm text-muted-foreground">
                开启后，User必须Login才能Download File（不影响浏览列表和Detail）
              </p>
            </div>
            <Switch
              checked={settings.custom_settings?.require_login_to_download === true}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  custom_settings: {
                    ...settings.custom_settings,
                    require_login_to_download: checked,
                  },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Save中..." : "SaveSettings"}
        </Button>
      </div>
    </div>
  );
}
