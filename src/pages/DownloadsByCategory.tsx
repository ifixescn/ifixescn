import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDownloadsByCategory, getCategoryById, getSiteSetting } from "@/db/api";
import type { Download, Category } from "@/types";
import { Download as DownloadIcon, Calendar, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";

export default function DownloadsByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, translateText, isDefaultLang, currentLang } = useTranslation();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  // 翻译后的分类字段
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const [translatedCategoryDesc, setTranslatedCategoryDesc] = useState<string>("");

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  // 语言切换时同步翻译分类名称和描述
  useEffect(() => {
    if (!category) return;
    setTranslatedCategoryName(category.name);
    setTranslatedCategoryDesc(category.description || "");
    if (isDefaultLang) return;
    let cancelled = false;
    translateText(category.name).then((r) => { if (!cancelled) setTranslatedCategoryName(r); });
    if (category.description) translateText(category.description).then((r) => { if (!cancelled) setTranslatedCategoryDesc(r); });
    return () => { cancelled = true; };
  }, [category, currentLang, isDefaultLang, translateText]);

  async function loadData() {
    try {
      setLoading(true);
      const [downloadsData, categoryData, siteNameData] = await Promise.all([
        getDownloadsByCategory(categoryId!),
        getCategoryById(categoryId!),
        getSiteSetting("site_name")
      ]);
      setDownloads(downloadsData);
      setCategory(categoryData);
      if (siteNameData?.value) setSiteName(siteNameData.value);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title={`${translatedCategoryName || category?.name || 'Downloads'} - ${siteName || 'iFixes'}`}
        description={translatedCategoryDesc || category?.description || `Browse ${category?.name || 'downloads'}`}
        keywords={category?.seo_keywords || category?.name || 'downloads'}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
              { "@type": "ListItem", "position": 2, "name": "Downloads", "item": `${window.location.origin}/downloads` },
              { "@type": "ListItem", "position": 3, "name": category?.name || "Downloads", "item": window.location.href }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": category?.name,
            "description": category?.description || `Browse ${category?.name} downloads`,
            "url": window.location.href,
            "isPartOf": { "@type": "WebSite", "name": siteName || "iFixes", "url": window.location.origin }
          })}
        </script>
      </Helmet>
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/downloads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("cat.backToDownloadList", "Back to Download List")}
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <DownloadIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">
                {translatedCategoryName || category?.name || "Category Downloads"}
              </h1>
              {category?.description && (
                <p className="text-muted-foreground mt-2">
                  {translatedCategoryDesc || category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{downloads.length} {t("cat.downloadsCount", "downloads")}</span>
          </div>
        </div>

        {downloads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DownloadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t("cat.noDownloads", "No downloads in this category yet")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {downloads.map((download) => (
              <Card key={download.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 xl:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="line-clamp-2 flex-1">
                      <Link
                        to={`/downloads/${download.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <TranslatedText text={download.title} />
                      </Link>
                    </CardTitle>
                    {download.file_size && (
                      <Badge variant="secondary">
                        {formatFileSize(download.file_size)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {download.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      <TranslatedText text={download.description} />
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(download.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <Button size="sm" asChild>
                      <Link to={`/downloads/${download.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
