import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Activity, FileText, HelpCircle, MessageSquare, Download as DownloadIcon, Video as VideoIcon } from "lucide-react";
import { getPostTimeline } from "@/db/api";
import type { MemberPostWithAuthor } from "@/types";
import { format } from "date-fns";

export default function ActivityFeed() {
  const [posts, setPosts] = useState<MemberPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadPosts();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (!isPaused) {
        loadPosts();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isPaused]);

  const loadPosts = async () => {
    try {
      const result = await getPostTimeline(null, 1, 50);
      setPosts(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load activity feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type?: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'question':
        return <HelpCircle className="h-4 w-4" />;
      case 'answer':
        return <MessageSquare className="h-4 w-4" />;
      case 'download':
        return <DownloadIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityTypeLabel = (type?: string) => {
    switch (type) {
      case 'article':
        return 'Article';
      case 'question':
        return 'Question';
      case 'answer':
        return 'Answer';
      case 'download':
        return 'Download';
      case 'video':
        return 'Video';
      default:
        return 'Post';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Feed
          <Badge variant="secondary" className="ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div 
          ref={scrollRef}
          className="space-y-4 max-h-[600px] overflow-y-auto pr-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No activities yet
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author?.avatar_url} />
                  <AvatarFallback>
                    {post.author?.username?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {post.author?.username || 'Unknown User'}
                    </span>
                    {post.related_type && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getActivityIcon(post.related_type)}
                        {getActivityTypeLabel(post.related_type)}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {format(new Date(post.created_at), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>👍 {post.like_count || 0}</span>
                    <span>💬 {post.comment_count || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
