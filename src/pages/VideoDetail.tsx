import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, AlertCircle, Play, RefreshCw } from "lucide-react";
import { getVideoById, incrementVideoViewCount, getCategories, getModuleSetting } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Video as VideoType, Category, ModuleSetting } from "@/types";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";
import VideoPlayer from "@/components/ui/video";
import { Helmet } from "react-helmet-async";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [video, setVideo] = useState<VideoType | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [moduleSetting, setModuleSetting] = useState<ModuleSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);
  const [canWatch, setCanWatch] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [useCustomPlayer, setUseCustomPlayer] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Record browsing history
  useRecordBrowsing("video", video?.id, video?.title);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [videoData, moduleSettingData] = await Promise.all([
        getVideoById(id),
        getModuleSetting("video")
      ]);
      
      setVideo(videoData);
      setModuleSetting(moduleSettingData);

      // Check whether can watch
      const requireLogin = moduleSettingData?.custom_settings?.require_login_to_watch === true;
      const hasPermission = !requireLogin || !!profile;
      setCanWatch(hasPermission);

      if (videoData?.category_id) {
        const categories = await getCategories("video");
        const cat = categories.find((c) => c.id === videoData.category_id);
        setCategory(cat || null);
      }

      // Increase views (only once, when authorized to watch)
      if (videoData && !viewCounted && hasPermission) {
        await incrementVideoViewCount(id);
        setViewCounted(true);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: t("detail.videoLoadFailed", "Loading Failed"),
        description: t("detail.videoLoadFailedDesc", "Failed to load video details. Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
    toast({
      title: t("detail.videoPlayError", "Video Playback Error"),
      description: t("detail.videoPlayErrorDesc", "Unable to load video. Please check your network connection or try again later."),
      variant: "destructive",
    });
  };

  const handleRetry = () => {
    setVideoError(false);
    setUseCustomPlayer(!useCustomPlayer);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <div className="text-lg text-muted-foreground">{t("detail.loadingVideo", "Loading video...")}</div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("detail.videoNotFound", "Video not found. The video may have been removed or the link is incorrect.")}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate("/videos")} variant="outline">
            {t("detail.backToVideos", "Back to Videos")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta 
        title={video.title}
        description={video.description || `Watch ${video.title} - Video tutorial and guide`}
        keywords={`video, tutorial, ${video.title}, ${category?.name || 'guide'}`}
        image={video.cover_image || undefined}
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
              { "@type": "ListItem", "position": 2, "name": "Videos", "item": `${window.location.origin}/videos` },
              ...(category ? [{ "@type": "ListItem", "position": 3, "name": category.name, "item": `${window.location.origin}/videos/category/${category.id}` }] : []),
              { "@type": "ListItem", "position": category ? 4 : 3, "name": video.title, "item": window.location.href }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": video.title,
            "description": video.description || `Watch ${video.title}`,
            "thumbnailUrl": video.cover_image,
            "uploadDate": video.created_at,
            "url": window.location.href
          })}
        </script>
      </Helmet>
      
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-0">
            {/* Video Player */}
            <div className="aspect-video bg-black relative">
              {canWatch ? (
                <>
                  {!videoError && video.video_url ? (
                    useCustomPlayer ? (
                      <div className="w-full h-full">
                        <VideoPlayer
                          src={video.video_url}
                          poster={video.cover_image || undefined}
                          controls={true}
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <video
                        controls
                        className="w-full h-full"
                        poster={video.cover_image || undefined}
                        src={video.video_url}
                        onError={handleVideoError}
                        preload="metadata"
                      >
                        <source src={video.video_url} type="video/mp4" />
                        <source src={video.video_url} type="video/webm" />
                        <source src={video.video_url} type="video/ogg" />
                        Your browser does not support video playback. Please try a different browser.
                      </video>
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <div className="text-center space-y-4 p-6">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <div className="space-y-2">
                          <p className="text-lg font-semibold">Video Playback Error</p>
                          <p className="text-sm text-muted-foreground">
                            Unable to load the video. This may be due to:
                          </p>
                          <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
                            <li>• Network connection issues</li>
                            <li>• Video file format not supported</li>
                            <li>• Video file has been moved or deleted</li>
                          </ul>
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button onClick={handleRetry} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Alternative Player
                          </Button>
                          <Button onClick={() => window.location.reload()} variant="default" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reload Page
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <Alert className="max-w-md mx-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <div className="space-y-3">
                        <p className="font-semibold">{t("detail.loginToWatchTitle", "Login Required")}</p>
                        <p className="text-sm">{t("detail.loginToWatchDesc", "You need to log in to watch this video.")}</p>
                        <Button
                          onClick={() => navigate("/login")}
                          className="w-full"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {t("detail.loginToWatch", "Login to Watch")}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </CardContent>

          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-2xl md:text-3xl mb-4">{video.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category && (
                    <Badge variant="secondary" className="text-sm">
                      {category.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {video.description && (
              <p className="text-muted-foreground mb-4 leading-relaxed">{video.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground border-t pt-4">
              {video.duration && (
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>{t("detail.duration", "Duration:")} {formatDuration(video.duration)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{video.view_count || 0} {t("detail.views", "views")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{t("detail.published", "Published:")} {formatDate(video.created_at)}</span>
              </div>
            </div>
          </CardHeader>

          {video.content && (
            <CardContent>
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">{t("detail.videoDescription", "Video Description")}</h3>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: video.content }}
                />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Back Button */}
        <div className="mt-6">
          <Button onClick={() => navigate("/videos")} variant="outline">
            ← {t("detail.backToVideos", "Back to Videos")}
          </Button>
        </div>
      </div>
    </div>
  );
}
