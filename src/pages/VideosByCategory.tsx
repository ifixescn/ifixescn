import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getVideosByCategory, getCategoryById, getSiteSetting } from "@/db/api";
import type { Video, Category } from "@/types";
import { Video as VideoIcon, Calendar, Clock, ArrowLeft, Play, Eye } from "lucide-react";
import { Helmet } from "react-helmet-async";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";
import VideoThumbnail from "@/components/common/VideoThumbnail";

export default function VideosByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, translateText, isDefaultLang, currentLang } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const [translatedCategoryDesc, setTranslatedCategoryDesc] = useState<string>("");

  useEffect(() => {
    if (categoryId) loadData();
  }, [categoryId]);

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
      const [videosData, categoryData, siteNameData] = await Promise.all([
        getVideosByCategory(categoryId!),
        getCategoryById(categoryId!),
        getSiteSetting("site_name"),
      ]);
      setVideos(videosData);
      setCategory(categoryData);
      if (siteNameData?.value) setSiteName(siteNameData.value);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  const catName = translatedCategoryName || category?.name || "Video Category";
  const catDesc = translatedCategoryDesc || category?.description;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${catName} - ${siteName || "iFixes"}`}
        description={catDesc || `Browse all videos in the ${catName} category`}
        keywords={category?.seo_keywords || category?.name || "videos"}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
              { "@type": "ListItem", position: 2, name: "Videos", item: `${window.location.origin}/videos` },
              { "@type": "ListItem", position: 3, name: category?.name || "Videos", item: window.location.href },
            ],
          })}
        </script>
      </Helmet>

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <Button variant="ghost" asChild className="mb-4 -ml-2">
            <Link to="/videos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("cat.backToVideoList", "Back to Videos")}
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <VideoIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold break-keep text-balance">{catName}</h1>
          </div>
          {catDesc && (
            <p className="text-muted-foreground text-base max-w-xl mt-2">{catDesc}</p>
          )}
          <p className="text-sm text-muted-foreground mt-3">
            {videos.length} {videos.length === 1 ? "video" : "videos"}
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl bg-muted" />
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-full bg-muted" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <VideoIcon className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              {t("cat.noVideos", "No videos in this category")}
            </p>
            <Button variant="outline" asChild>
              <Link to="/videos">{t("cat.backToVideoList", "Browse all videos")}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/videos/${video.id}`}
                className="group rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  <VideoThumbnail
                    videoUrl={video.video_url}
                    coverImage={video.cover_image ?? undefined}
                    title={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <Play className="h-6 w-6 text-black ml-0.5" />
                    </div>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                {/* Text area */}
                <div className="flex-1 flex flex-col p-4 gap-2">
                  <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                    <TranslatedText text={video.title} />
                  </h3>
                  {video.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                      <TranslatedText text={video.description} />
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(video.created_at).toLocaleDateString("zh-CN")}
                    </span>
                    {video.view_count != null && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {video.view_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
