import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Calendar, AlertCircle } from "lucide-react";
import { getVideoById, incrementVideoViewCount, getCategories, getModuleSetting } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Video, Category, ModuleSetting } from "@/types";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [moduleSetting, setModuleSetting] = useState<ModuleSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCounted, setViewCounted] = useState(false);
  const [canWatch, setCanWatch] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // 记录浏览历史
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

      // 检查whether can watch
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
        title: "Loading failed",
        description: "Failed to load video details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Video not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="p-0">
            {/* Video Player */}
            <div className="aspect-video bg-black relative">
              {canWatch ? (
                <video
                  controls
                  className="w-full h-full"
                  poster={video.cover_image || undefined}
                  src={video.video_url}
                >
                  Your browser does not support video playback
                </video>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Alert className="max-w-md mx-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      <div className="space-y-2">
                        <p>Login required to watch this video</p>
                        <button
                          onClick={() => navigate("/login")}
                          className="text-primary hover:underline"
                        >
                          Click to login
                        </button>
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
                <CardTitle className="text-3xl mb-4">{video.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category && (
                    <Badge variant="secondary">{category.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            {video.description && (
              <p className="text-muted-foreground mb-4">{video.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {video.duration && (
                <div className="flex items-center gap-1">
                  <span>Duration: {formatDuration(video.duration)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>{video.view_count} views</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(video.created_at)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* 详细内容 */}
            {video.content && (
              <div
                className="rich-content"
                dangerouslySetInnerHTML={{ __html: video.content }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
