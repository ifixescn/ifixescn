import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Video as VideoIcon, Eye, Play, Clock, Search } from "lucide-react";
import { getVideos, getCategories } from "@/db/api";
import type { Video, Category } from "@/types";
import PageMeta from "@/components/common/PageMeta";
import VideoThumbnail from "@/components/common/VideoThumbnail";
import TranslatedText from "@/components/common/TranslatedText";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Videos() {
  const { t } = useTranslation();
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videosData, categoriesData] = await Promise.all([
        getVideos({ categoryId: selectedCategory || undefined }),
        getCategories("video"),
      ]);
      setVideos(videosData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Video Library"
        description="Watch comprehensive phone repair video tutorials and learn repair techniques from professional technician guides."
        keywords="repair videos, repair tutorials, video guides, repair demos, instructional videos, repair training"
      />

      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <VideoIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold break-keep text-balance">
              {t("videos.title", "Video Library")}
            </h1>
          </div>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl">
            {t("videos.watchNow", "Browse tutorials and demo videos to master repair skills")}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === "" ? "default" : "outline"}
                onClick={() => setSelectedCategory("")}
                className="rounded-full"
              >
                {t("videos.allCategories", "All")}
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="rounded-full"
                >
                  <TranslatedText text={cat.name} />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Skeleton loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-xl bg-muted" />
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <Skeleton className="h-3 w-full bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-9 w-9 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">
              {t("videos.noVideos", "No videos found")}
            </p>
            {selectedCategory && (
              <Button variant="outline" size="sm" onClick={() => setSelectedCategory("")}>
                {t("videos.clearFilter", "Clear filter")}
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Video count */}
            <p className="text-sm text-muted-foreground mb-4">
              {videos.length} {videos.length === 1 ? "video" : "videos"}
            </p>
            {/* Video grid */}
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
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="h-6 w-6 text-black ml-0.5" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    {video.duration && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                        <Clock className="h-3 w-3" />
                        {formatDuration(video.duration)}
                      </div>
                    )}
                    {/* Category badge */}
                    {video.category_id && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs bg-black/50 text-white border-transparent hover:bg-black/60">
                          <TranslatedText text={categories.find((c) => c.id === video.category_id)?.name || ""} />
                        </Badge>
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
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto pt-2 border-t border-border">
                      <Eye className="h-3.5 w-3.5" />
                      <span>{video.view_count || 0} {t("videos.views", "views")}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

