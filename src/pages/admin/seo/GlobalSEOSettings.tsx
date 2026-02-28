import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { Helmet } from "react-helmet-async";
import { Save, Globe, Image, Twitter, BarChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getSEOSettings, updateSEOSettings } from "@/db/api";
import type { SEOSettingsFormData } from "@/types";

export default function GlobalSEOSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { toast } = useToast();
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<SEOSettingsFormData>({
    mode: "onChange",
    defaultValues: {
      site_title: "",
      site_description: "",
      site_keywords: "",
      site_author: "",
      og_image: "",
      twitter_handle: "",
      google_analytics_id: "",
      google_search_console_id: "",
      bing_webmaster_id: "",
      robots_txt: "",
    }
  });

  // 加载 SEO 设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setFetching(true);
      const settings = await getSEOSettings();
      if (settings) {
        reset({
          site_title: settings.site_title,
          site_description: settings.site_description,
          site_keywords: settings.site_keywords,
          site_author: settings.site_author,
          og_image: settings.og_image || '',
          twitter_handle: settings.twitter_handle || '',
          google_analytics_id: settings.google_analytics_id || '',
          google_search_console_id: settings.google_search_console_id || '',
          bing_webmaster_id: settings.bing_webmaster_id || '',
          robots_txt: settings.robots_txt,
        });
      }
    } catch (error) {
      console.error("Failed to load SEO settings:", error);
      toast({
        title: "Loading Failed",
        description: "Unable to load SEO settings, please refresh and try again",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const onSubmit = async (data: SEOSettingsFormData) => {
    try {
      setLoading(true);
      const success = await updateSEOSettings(data);
      
      if (success) {
        // 触发设置更新事件，通知其他组件刷新
        window.dispatchEvent(new Event('settingsUpdated'));
        
        toast({
          title: "Saved Successfully",
          description: "Global SEO settings have been updated",
        });
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Failed to save SEO settings:", error);
      toast({
        title: "Save Failed",
        description: "Unable to save SEO settings, please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Global SEO Settings - Admin Panel</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Global SEO Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure global SEO information for your website, including basic info, social media tags, and search engine verification
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">
                <Globe className="h-4 w-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="social">
                <Image className="h-4 w-4 mr-2" />
                Social Media
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="robots">
                <FileText className="h-4 w-4 mr-2" />
                Robots.txt
              </TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Website Basic Information</CardTitle>
                  <CardDescription>
                    Set your website's title, description, keywords and other basic SEO information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="site_title">Site Title *</Label>
                    <Controller
                      name="site_title"
                      control={control}
                      rules={{ required: "Please enter site title" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="site_title"
                          placeholder="iFixes - Global Leading Mobile Phone Repair Resource Integration Service Provider"
                        />
                      )}
                    />
                    {errors.site_title && (
                      <p className="text-sm text-destructive">{errors.site_title.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Recommended length: 50-60 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_description">Site Description *</Label>
                    <Controller
                      name="site_description"
                      control={control}
                      rules={{ required: "Please enter site description" }}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="site_description"
                          placeholder="iFixes provides comprehensive mobile phone repair resources, including repair guides, parts sourcing, technical support and professional training..."
                          rows={4}
                        />
                      )}
                    />
                    {errors.site_description && (
                      <p className="text-sm text-destructive">{errors.site_description.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Recommended length: 150-160 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_keywords">Site Keywords *</Label>
                    <Controller
                      name="site_keywords"
                      control={control}
                      rules={{ required: "Please enter site keywords" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="site_keywords"
                          placeholder="mobile phone repair, smartphone repair, screen repair, battery replacement"
                        />
                      )}
                    />
                    {errors.site_keywords && (
                      <p className="text-sm text-destructive">{errors.site_keywords.message}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Separate multiple keywords with commas, recommend 3-5 main keywords
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="site_author">Site Author *</Label>
                    <Controller
                      name="site_author"
                      control={control}
                      rules={{ required: "Please enter site author" }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="site_author"
                          placeholder="iFixes"
                        />
                      )}
                    />
                    {errors.site_author && (
                      <p className="text-sm text-destructive">{errors.site_author.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 社交媒体 */}
            <TabsContent value="social">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Open Graph Settings</CardTitle>
                    <CardDescription>
                      Configure information displayed when shared on social media (e.g. Facebook, LinkedIn)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="og_image">Default Share Image URL</Label>
                      <Controller
                        name="og_image"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="og_image"
                            placeholder="https://example.com/og-image.jpg"
                            type="url"
                          />
                        )}
                      />
                      <p className="text-sm text-muted-foreground">
                        Recommended size: 1200x630 pixels, Format: JPG or PNG
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <Twitter className="h-5 w-5 inline mr-2" />
                      Twitter Card Settings
                    </CardTitle>
                    <CardDescription>
                      Configure information displayed when shared on Twitter
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="twitter_handle">Twitter Handle</Label>
                      <Controller
                        name="twitter_handle"
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            id="twitter_handle"
                            placeholder="@iFixes"
                          />
                        )}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter your Twitter username (including @ symbol)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* 分析工具 */}
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Verification</CardTitle>
                  <CardDescription>
                    Configure verification IDs for major search engines for website analytics and search console
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                    <Controller
                      name="google_analytics_id"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="google_analytics_id"
                          placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                        />
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your tracking ID from Google Analytics
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="google_search_console_id">Google Search Console Verification Code</Label>
                    <Controller
                      name="google_search_console_id"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="google_search_console_id"
                          placeholder="Verification meta tag content value"
                        />
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get verification code from Google Search Console
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bing_webmaster_id">Bing Webmaster Verification Code</Label>
                    <Controller
                      name="bing_webmaster_id"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          id="bing_webmaster_id"
                          placeholder="Verification meta tag content value"
                        />
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get verification code from Bing Webmaster Tools
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Robots.txt */}
            <TabsContent value="robots">
              <Card>
                <CardHeader>
                  <CardTitle>Robots.txt Configuration</CardTitle>
                  <CardDescription>
                    Customize robots.txt file content to control search engine crawler access rules
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="robots_txt">Robots.txt Content</Label>
                    <Controller
                      name="robots_txt"
                      control={control}
                      render={({ field }) => (
                        <Textarea
                          {...field}
                          id="robots_txt"
                          placeholder="User-agent: *&#10;Allow: /&#10;Sitemap: /sitemap.xml"
                          rows={10}
                          className="font-mono text-sm"
                        />
                      )}
                    />
                    <p className="text-sm text-muted-foreground">
                      Configure search engine crawler access rules, one rule per line
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Common Rules Example:</p>
                    <pre className="text-xs font-mono bg-background p-2 rounded">
{`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://yourdomain.com/sitemap.xml`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
