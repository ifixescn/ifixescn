import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Heart, MessageCircleMore, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import {
  getPostTimeline,
  getUserPosts,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments,
  addPostComment,
} from "@/db/api";
import type { MemberPostWithAuthor, PostCommentWithAuthor } from "@/types";

interface PostsTabProps {
  userId: string;
  viewMode?: "timeline" | "user";
  targetUserId?: string;
}

export default function PostsTab({ userId, viewMode = "timeline", targetUserId }: PostsTabProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<MemberPostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<MemberPostWithAuthor | null>(null);
  const [comments, setComments] = useState<PostCommentWithAuthor[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [userId, viewMode, targetUserId]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let data;
      if (viewMode === "user" && targetUserId) {
        const result = await getUserPosts(targetUserId);
        data = result.data;
      } else {
        const result = await getPostTimeline(userId);
        data = result.data;
      }
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPost = async () => {
    if (!newPostContent.trim()) {
      toast({
        title: "Notice",
        description: "Please enter post content",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPublishing(true);
      await createPost(userId, newPostContent.trim());
      setNewPostContent("");
      toast({
        title: "Success",
        description: "Post published successfully",
      });
      loadPosts();
    } catch (error) {
      console.error("Failed to publish post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLikePost = async (postId: string, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikePost(postId, userId);
      } else {
        await likePost(postId, userId);
      }
      
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isLiked,
            like_count: isLiked ? post.like_count - 1 : post.like_count + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error("Failed to like/unlike post:", error);
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(postId);
      setPosts(posts.filter(post => post.id !== postId));
      toast({
        title: "Success",
        description: "Post deleted",
      });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const result = await getPostComments(postId);
      setComments(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      setIsCommenting(true);
      const comment = await addPostComment(selectedPost.id, userId, newComment.trim());
      setComments([...comments, comment]);
      setNewComment("");
      
      setPosts(posts.map(post => {
        if (post.id === selectedPost.id) {
          return { ...post, comment_count: post.comment_count + 1 };
        }
        return post;
      }));

      toast({
        title: "Success",
        description: "Comment published",
      });
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({
        title: "Error",
        description: "Failed to publish comment",
        variant: "destructive",
      });
    } finally {
      setIsCommenting(false);
    }
  };

  const getMemberLevelBadge = (level: string) => {
    const levelColors: Record<string, string> = {
      guest: "bg-gray-500",
      member: "bg-blue-500",
      premium: "bg-purple-500",
      svip: "bg-amber-500",
    };
    return levelColors[level] || "bg-gray-500";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Publish Post */}
      {viewMode === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Publish Post</CardTitle>
            <CardDescription>Share your thoughts and feelings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Share something new..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handlePublishPost} disabled={isPublishing}>
                <Send className="h-4 w-4 mr-2" />
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Posts Timeline</CardTitle>
          <CardDescription>
            {viewMode === "user" ? "User's posts" : "Latest posts"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No posts yet</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border rounded-lg p-4 space-y-3">
                {/* Author Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author?.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.author?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {post.author?.nickname || post.author?.username || "Unknown User"}
                        </span>
                        <Badge className={getMemberLevelBadge(post.author?.member_level || "guest")}>
                          {post.author?.member_level || "guest"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}
                      </p>
                    </div>
                  </div>
                  {post.author_id === userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePost(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Post Content */}
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {post.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt=""
                        className="w-full h-32 object-cover rounded"
                      />
                    ))}
                  </div>
                )}

                {/* Interaction Buttons */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id, post.is_liked || false)}
                    className={post.is_liked ? "text-red-500" : ""}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${post.is_liked ? "fill-current" : ""}`} />
                    {post.like_count}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPost(post);
                          loadComments(post.id);
                        }}
                      >
                        <MessageCircleMore className="h-4 w-4 mr-1" />
                        {post.comment_count}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Comments</DialogTitle>
                        <DialogDescription>
                          View and post comments
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Comments List */}
                        {comments.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4">No comments yet</p>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="flex gap-3 border-b pb-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.author?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {comment.author?.username?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {comment.author?.nickname || comment.author?.username}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.created_at), "MM-dd HH:mm")}
                                  </span>
                                </div>
                                <p className="text-sm mt-1">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Textarea
                          placeholder="Write your comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button onClick={handleAddComment} disabled={isCommenting}>
                          <Send className="h-4 w-4 mr-2" />
                          Send
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
