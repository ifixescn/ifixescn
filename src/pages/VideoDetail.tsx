import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, AlertCircle, Play, Clock, ArrowLeft, RefreshCw, LogIn } from "lucide-react";
import { getVideoById, incrementVideoViewCount, getCategories, getModuleSetting } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Video as VideoType, Category, ModuleSetting } from "@/types";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";
import VideoPlayer from "@/components/ui/video";
import { Helmet } from "react-helmet-async";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, translateText, isDefaultLang, currentLang } = useTranslation();
  const [video, setVideo] = useState<VideoType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [moduleSetting, setModuleSetting] = useState<ModuleSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);
  const [canWatch, setCanWatch] = useState(false);
  const [videoError, setVideoError] = useState(false);
  // Translated fields
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [translatedDescription, setTranslatedDescription] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Record browsing history
  useRecordBrowsing("video", video?.id, video?.title);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  // Sync translations when language switches
  useEffect(() => {
    if (!video) return;
    setTranslatedTitle(video.title || "");
    setTranslatedDescription(video.description || "");
    setTranslatedContent(video.content || "");
    if (isDefaultLang) return;
    let cancelled = false;
    if (video.title) translateText(video.title).then((r) => { if (!cancelled) setTranslatedTitle(r); });
    if (video.description) translateText(video.description).then((r) => { if (!cancelled) setTranslatedDescription(r); });
    if (video.content) translateText(video.content).then((r) => { if (!cancelled) setTranslatedContent(r); });
    return () => { cancelled = true; };
  }, [video, currentLang, isDefaultLang, translateText]);

  useEffect(() => {
    if (!category) return;
    setTranslatedCategoryName(category.name);
    if (isDefaultLang) return;
    let cancelled = false;
    translateText(category.name).then((r) => { if (!cancelled) setTranslatedCategoryName(r); });
    return () => { cancelled = true; };
  }, [category, currentLang, isDefaultLang, translateText]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [videoData, moduleSettingData] = await Promise.all([
        getVideoById(id),
        getModuleSetting("video"),
      ]);
      setVideo(videoData);
      setModuleSetting(moduleSettingData);

      const requireLogin = moduleSettingData?.custom_settings?.require_login_to_watch === true;
      const hasPermission = !requireLogin || !!profile;
      setCanWatch(hasPermission);

      if (videoData?.category_id) {
        const cats = await getCategories("video");
        setCategory(cats.find((c) => c.id === videoData.category_id) || null);
      }

      if (videoData && !viewCounted && hasPermission) {
        await incrementVideoViewCount(id);
        setViewCounted(true);
      }
    } catch (error) {
      console.error("Failed to load video:", error);
      toast.error(t("detail.videoLoadFailed", "Load failed"), {
        description: t("detail.videoLoadFailedDesc", "Could not load video details. Please try again later."),
      });
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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });

  /* ---------- Loading skeleton ---------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <Skeleton className="h-6 w-32 bg-muted" />
          <Skeleton className="w-full aspect-video rounded-xl bg-muted" />
          <Skeleton className="h-8 w-2/3 bg-muted" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-4/5 bg-muted" />
        </div>
      </div>
    );
  }

  /* ---------- Video not found ---------- */
  if (!video) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold">
            {t("detail.videoNotFound", "Video not found")}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t("detail.videoNotFoundDesc", "This video may have been deleted or the link is invalid.")}
          </p>
          <Button onClick={() => navigate("/videos")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("detail.backToVideos", "Back to Videos")}
          </Button>
        </div>
      </div>
    );
  }

  const title = translatedTitle || video.title;
  const description = translatedDescription || video.description;
  const content = translatedContent || video.content;
  const catName = translatedCategoryName || category?.name;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={title}
        description={description || `Watch ${title} - Video Tutorial`}
        keywords={`video, tutorial, ${title}, ${catName || "guide"}`}
        image={video.cover_image || undefined}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: window.location.origin },
              { "@type": "ListItem", position: 2, name: "Videos", item: `${window.location.origin}/videos` },
              ...(category ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${window.location.origin}/videos/category/${category.id}` }] : []),
              { "@type": "ListItem", position: category ? 4 : 3, name: video.title, item: window.location.href },
            ],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: video.title,
            description: video.description || `Watch ${video.title}`,
            thumbnailUrl: video.cover_image,
            uploadDate: video.created_at,
            url: window.location.href,
          })}
        </script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/videos" className="hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("detail.backToVideos", "Videos")}
          </Link>
          {category && (
            <>
              <span>/</span>
              <Link to={`/videos/category/${category.id}`} className="hover:text-foreground transition-colors">
                {catName}
              </Link>
            </>
          )}
        </nav>

        {/* Player area */}
        <div className="w-full rounded-2xl overflow-hidden bg-black shadow-2xl">
          {canWatch ? (
            videoError ? (
              /* Playback error notice */
              <div className="aspect-video flex flex-col items-center justify-center bg-neutral-900 gap-4 p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-400" />
                <div className="space-y-1">
                  <p className="text-white font-semibold text-lg">{t("detail.videoPlayError", "Playback failed")}</p>
                  <p className="text-white/60 text-sm">Network issue, unsupported format, or file no longer available</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10"
                    onClick={() => { setVideoError(false); }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t("detail.retry", "Retry")}
                  </Button>
                  <Button size="sm" onClick={() => window.location.reload()} className="bg-primary">
                    {t("detail.reloadPage", "Reload page")}
                  </Button>
                </div>
              </div>
            ) : video.video_url ? (
              <VideoPlayer
                src={video.video_url}
                poster={video.cover_image || undefined}
                controls={true}
                aspectRatio="16:9"
                className="w-full"
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center bg-neutral-900">
                <p className="text-white/60">{t("detail.noVideo", "No video file available")}</p>
              </div>
            )
          ) : (
            /* Login required */
            <div className="aspect-video flex items-center justify-center bg-neutral-900">
              <div className="text-center space-y-4 p-6 max-w-sm">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-white font-semibold text-lg mb-1">
                    {t("detail.loginToWatchTitle", "Login to watch")}
                  </p>
                  <p className="text-white/60 text-sm">
                    {t("detail.loginToWatchDesc", "This video requires login to watch")}
                  </p>
                </div>
                <Button onClick={() => navigate("/login")} className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("detail.loginToWatch", "Login now")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Video info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primary info */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">{title}</h1>
              {catName && (
                <Link to={`/videos/category/${category?.id}`}>
                  <Badge variant="secondary" className="hover:bg-secondary/80 cursor-pointer">
                    {catName}
                  </Badge>
                </Link>
              )}
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground py-3 border-y border-border">
              {video.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(video.duration)}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                {video.view_count || 0} {t("detail.views", "views")}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(video.created_at)}
              </span>
            </div>

            {/* Summary */}
            {description && (
              <p className="text-muted-foreground leading-relaxed">{description}</p>
            )}

            {/* Rich text content */}
            {content && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">{t("detail.videoDescription", "Video Details")}</h3>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}
          </div>

          {/* Side info card */}
          <aside className="space-y-4">
            {video.cover_image && (
              <div className="rounded-xl overflow-hidden border border-border">
                <img
                  src={video.cover_image}
                  alt={title}
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}
            <div className="rounded-xl border border-border p-4 space-y-3 text-sm">
              <h4 className="font-semibold">{t("detail.videoInfo", "Video Info")}</h4>
              {catName && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.category", "Category")}</span>
                  <span>{catName}</span>
                </div>
              )}
              {video.duration && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("detail.duration", "Duration")}</span>
                  <span>{formatDuration(video.duration)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("detail.views", "Views")}</span>
                <span>{video.view_count || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("detail.published", "Published")}</span>
                <span>{formatDate(video.created_at)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
