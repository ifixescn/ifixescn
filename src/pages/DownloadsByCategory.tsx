import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDownloadsByCategory, getCategoryById, getSiteSetting } from "@/db/api";
import type { Download, Category } from "@/types";
import { Download as DownloadIcon, Calendar, ArrowLeft, FileText, ChevronRight, Eye, HardDrive, Lock } from "lucide-react";
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
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const [translatedCategoryDesc, setTranslatedCategoryDesc] = useState<string>("");

  useEffect(() => { if (categoryId) loadData(); }, [categoryId]);

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
        getSiteSetting("site_name"),
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

  const catDisplayName = translatedCategoryName || category?.name || "Downloads";

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${catDisplayName} - ${siteName || "iFixes"}`}
        description={translatedCategoryDesc || category?.description || `Browse ${category?.name || "downloads"}`}
        keywords={category?.seo_keywords || category?.name || "downloads"}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
              { "@type": "ListItem", "position": 2, "name": "Downloads", "item": `${window.location.origin}/downloads` },
              { "@type": "ListItem", "position": 3, "name": category?.name || "Downloads", "item": window.location.href },
            ],
          })}
        </script>
      </Helmet>

      {/* Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="container mx-auto px-4 max-w-6xl py-12 md:py-16 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/downloads" className="hover:text-primary transition-colors">
              {t("downloads.title", "Downloads")}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium">{catDisplayName}</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/20">
            <FileText className="h-3.5 w-3.5" />
            Category
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 break-keep text-balance">
            {catDisplayName}
          </h1>

          {(translatedCategoryDesc || category?.description) && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-xl mb-4">
              {translatedCategoryDesc || category?.description}
            </p>
          )}

          {!loading && (
            <p className="text-xs text-muted-foreground">
              {downloads.length} {t("cat.downloadsCount", "files available")}
            </p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 max-w-6xl py-8 md:py-10">

        {/* Back */}
        <Link to="/downloads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("cat.backToDownloadList", "Back to Download List")}
        </Link>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-5 space-y-3">
                <Skeleton className="bg-muted h-4 w-20 rounded-full" />
                <Skeleton className="bg-muted h-6 w-4/5" />
                <Skeleton className="bg-muted h-4 w-full" />
                <Skeleton className="bg-muted h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && downloads.length === 0 && (
          <div className="text-center py-20 border rounded-xl bg-muted/20">
            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
              <DownloadIcon className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("cat.noDownloads", "No downloads in this category yet")}
            </p>
          </div>
        )}

        {/* Download cards */}
        {!loading && downloads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {downloads.map((download) => (
              <div
                key={download.id}
                className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col"
              >
                {/* hover accent bar */}
                <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                <div className="flex flex-col flex-1 p-5 pl-6">
                  {/* Tags */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    {download.file_size && (
                      <Badge variant="outline" className="text-xs rounded-full gap-1">
                        <HardDrive className="h-2.5 w-2.5" />
                        {formatFileSize(download.file_size)}
                      </Badge>
                    )}
                    {download.require_member && (
                      <Badge className="text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 gap-1">
                        <Lock className="h-2.5 w-2.5" />
                        {t("member.profile", "Member")}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-foreground text-[0.9375rem] leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors flex-1">
                    <Link to={`/downloads/${download.id}`} className="hover:no-underline">
                      <TranslatedText text={download.title} />
                    </Link>
                  </h3>

                  {/* Description */}
                  {download.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                      <TranslatedText text={download.description} />
                    </p>
                  )}

                  {/* Meta + CTA */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5 text-primary/60" />
                      {new Date(download.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                    <Button asChild size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors gap-1.5">
                      <Link to={`/downloads/${download.id}`}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}
