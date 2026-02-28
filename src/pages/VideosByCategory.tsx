import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getVideosByCategory, getCategoryById, getSiteSetting } from "@/db/api";
import type { Video, Category } from "@/types";
import { Video as VideoIcon, Calendar, Clock, ArrowLeft } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";
import VideoThumbnail from "@/components/common/VideoThumbnail";

export default function VideosByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [videos, setVideos] = useState<Video[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  async function loadData() {
    try {
      setLoading(true);
      const [videosData, categoryData, siteNameData] = await Promise.all([
        getVideosByCategory(categoryId!),
        getCategoryById(categoryId!),
        getSiteSetting("site_name")
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
        title={`${category?.name || 'Videos'} - ${siteName || 'iFixes'}`}
        description={category?.description || `Browse ${category?.name || 'videos'}`}
        keywords={category?.seo_keywords || category?.name || 'videos'}
      />
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/videos">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Video List
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <VideoIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">
                {category?.name || "Category Videos"}
              </h1>
              {category?.description && (
                <p className="text-muted-foreground mt-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{videos.length} videos</span>
          </div>
        </div>

        {videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No videos in this category yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {videos.map((video) => (
              <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <VideoThumbnail
                    videoUrl={video.video_url}
                    coverImage={video.cover_image}
                    title={video.title}
                    className="hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardHeader className="p-3 xl:p-6">
                  <CardTitle className="line-clamp-2">
                    <Link
                      to={`/videos/${video.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      {video.title}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {video.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {video.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                      {video.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button size="sm" asChild>
                      <Link to={`/videos/${video.id}`}>
                        Watch Video
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

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
