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
import { MessageCircle, Save, Image as ImageIcon } from "lucide-react";
import type { ModuleSetting, ModuleSettingFormData } from "@/types";

export default function QuestionSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ModuleSetting | null>(null);
  const [formData, setFormData] = useState<ModuleSettingFormData>({
    display_name: "Q&A",
    banner_image: null,
    seo_title: "",
    seo_keywords: "",
    seo_description: "",
    is_enabled: true,
    sort_order: 0,
    items_per_page: 20,
    show_author: true,
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
      const data = await getModuleSetting("questions");
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
        description: "Failed to load Q&A module settings",
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
      await updateModuleSetting("questions", formData);
      toast({
        title: "Saved successfully",
        description: "Q&A module settings updated"
      });
      loadSettings();
      // Trigger custom event to notify Header component to refresh settings
      window.dispatchEvent(new Event("settingsUpdated"));
    } catch (error) {
      console.error("SaveSettingsFailed:", error);
      toast({
        title: "Save failed",
        description: "Failed to save Q&A module settings",
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
          <MessageCircle className="h-8 w-8" />
          Q&A Module Settings
        </h1>
        <p className="text-muted-foreground">Configure Q&A module display name, banner image, SEO settings, etc.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Settings</CardTitle>
            <CardDescription>Configure basic information for the Q&A module</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Module Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g.: Q&A, Community, Help Center"
                required
              />
              <p className="text-sm text-muted-foreground">
                This name will be displayed in the frontend navigation bar and page title
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Module</Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, the Q&A module will be hidden from the frontend
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
                Lower numbers appear first in the navigation bar
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Banner Image
            </CardTitle>
            <CardDescription>Upload banner image for the Q&A module</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUpload
              value={formData.banner_image || ""}
              onChange={(url) => setFormData({ ...formData, banner_image: url })}
              onRemove={() => setFormData({ ...formData, banner_image: null })}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Recommended size: 1200x400 pixels, supports JPG, PNG formats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize Q&A list page for search engines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seo_title">SEO Title</Label>
              <Input
                id="seo_title"
                value={formData.seo_title || ""}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Q&A Community - Site Name"
              />
              <p className="text-sm text-muted-foreground">
                Displayed in search engine results and browser tab title
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_keywords">SEO Keywords</Label>
              <Input
                id="seo_keywords"
                value={formData.seo_keywords || ""}
                onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                placeholder="Q&A, community, help, support"
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple keywords with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seo_description">SEO Description</Label>
              <Textarea
                id="seo_description"
                value={formData.seo_description || ""}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                placeholder="Ask questions and get answers in our Q&A community, get help and share knowledge"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Displayed in search engine results, recommended 120-160 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Configure display options for Q&A list and detail pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="items_per_page">Items Per Page</Label>
              <Input
                id="items_per_page"
                type="number"
                min="1"
                max="100"
                value={formData.items_per_page}
                onChange={(e) => setFormData({ ...formData, items_per_page: parseInt(e.target.value) || 20 })}
              />
              <p className="text-sm text-muted-foreground">
                Number of questions displayed per page in Q&A list
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Author</Label>
                <p className="text-sm text-muted-foreground">
                  Display author information in Q&A list and detail pages
                </p>
              </div>
              <Switch
                checked={formData.show_author}
                onCheckedChange={(checked) => setFormData({ ...formData, show_author: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Date</Label>
                <p className="text-sm text-muted-foreground">
                  Display question date in Q&A list and detail pages
                </p>
              </div>
              <Switch
                checked={formData.show_date}
                onCheckedChange={(checked) => setFormData({ ...formData, show_date: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Category</Label>
                <p className="text-sm text-muted-foreground">
                  Display category tags in Q&A list and detail pages
                </p>
              </div>
              <Switch
                checked={formData.show_category}
                onCheckedChange={(checked) => setFormData({ ...formData, show_category: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Comments</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, users can post comments on Q&A detail pages (feature under development)
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
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
