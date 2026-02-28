import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Video as VideoIcon, Eye, Play } from "lucide-react";
import { getVideos, getCategories } from "@/db/api";
import type { Video, Category } from "@/types";
import PageMeta from "@/components/common/PageMeta";
import VideoThumbnail from "@/components/common/VideoThumbnail";

export default function Videos() {
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
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta 
        title="Video Center"
        description="Watch comprehensive mobile phone repair video tutorials and demonstrations. Learn repair techniques through step-by-step video guides from expert technicians."
        keywords="repair videos, repair tutorials, video guides, repair demonstrations, how-to videos, repair training, video lessons"
      />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Video Center</h1>
        <p className="text-muted-foreground">
          Watch various tutorials and demo videos
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            onClick={() => setSelectedCategory("")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="text-center py-12">
          <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No videos yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              <div className="relative aspect-video bg-muted">
                <VideoThumbnail
                  videoUrl={video.video_url}
                  coverImage={video.cover_image}
                  title={video.title}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Link to={`/videos/${video.id}`}>
                    <Button size="sm" className="rounded-full xl:size-lg">
                      <Play className="h-4 w-4 xl:h-6 xl:w-6" />
                    </Button>
                  </Link>
                </div>
                {video.duration && (
                  <div className="absolute bottom-1 right-1 xl:bottom-2 xl:right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 xl:px-2 xl:py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              <CardHeader className="p-3 xl:p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm xl:text-lg mb-1 xl:mb-2 line-clamp-2">{video.title}</CardTitle>
                    {video.category_id && (
                      <Link to={`/videos/category/${video.category_id}`}>
                        <Badge variant="secondary" className="mb-1 xl:mb-2 hover:bg-secondary/80 cursor-pointer text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5">
                          {categories.find((c) => c.id === video.category_id)?.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                {video.description && (
                  <p className="text-xs xl:text-sm text-muted-foreground mb-2 xl:mb-4 line-clamp-2">
                    {video.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs xl:text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3 xl:h-4 xl:w-4" />
                    {video.view_count} views
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
