import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Eye, Search, Mail, FileText, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import {
  getAllPostsForAdmin,
  getAllMessagesForAdmin,
  deletePostByAdmin,
  deleteMessageByAdmin,
} from "@/db/api";
import type { MemberPostWithAuthor, MessageWithProfiles } from "@/types";

export default function SnsManage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<MemberPostWithAuthor[]>([]);
  const [messages, setMessages] = useState<MessageWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState<MemberPostWithAuthor | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithProfiles | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsResult, messagesResult] = await Promise.all([
        getAllPostsForAdmin(),
        getAllMessagesForAdmin(),
      ]);
      setPosts(Array.isArray(postsResult.data) ? postsResult.data : []);
      setMessages(Array.isArray(messagesResult.data) ? messagesResult.data : []);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;

    try {
      await deletePostByAdmin(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setSelectedPost(null);
      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message? This action cannot be undone.")) return;

    try {
      await deleteMessageByAdmin(messageId);
      setMessages(messages.filter((msg) => msg.id !== messageId));
      setSelectedMessage(null);
      toast({
        title: "Success",
        description: "Message deleted",
      });
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      post.content.toLowerCase().includes(searchLower) ||
      post.author?.username?.toLowerCase().includes(searchLower) ||
      post.author?.nickname?.toLowerCase().includes(searchLower)
    );
  });

  const filteredMessages = messages.filter((msg) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      msg.subject.toLowerCase().includes(searchLower) ||
      msg.content.toLowerCase().includes(searchLower) ||
      msg.sender?.username?.toLowerCase().includes(searchLower) ||
      msg.receiver?.username?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SNS Content Management</h1>
        <p className="text-muted-foreground mt-2">Manage member posts and messages</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search posts or messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">
            <FileText className="h-4 w-4 mr-2" />
            Member Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="h-4 w-4 mr-2" />
            Messages ({messages.length})
          </TabsTrigger>
        </TabsList>

        {/* Posts Management */}
        <TabsContent value="posts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Member Posts List</CardTitle>
              <CardDescription>View and manage all member posts</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No posts</p>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar>
                            <AvatarImage src={post.author?.avatar_url || undefined} />
                            <AvatarFallback>
                              {post.author?.username?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {post.author?.nickname || post.author?.username || "Unknown User"}
                              </span>
                              <Badge variant={post.status === "published" ? "default" : "secondary"}>
                                {post.status === "published" ? "Published" : "Deleted"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>👍 {post.like_count}</span>
                              <span>💬 {post.comment_count}</span>
                              <span>{format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPost(post);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePost(post.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Management */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Messages List</CardTitle>
              <CardDescription>View and manage all messages between members</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No messages yet</p>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className="border rounded-lg p-4 hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.sender?.avatar_url || undefined} />
                              <AvatarFallback>
                                {message.sender?.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {message.sender?.nickname || message.sender?.username}
                            </span>
                            <MessageCircle className="h-3 w-3 text-muted-foreground" />
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={message.receiver?.avatar_url || undefined} />
                              <AvatarFallback>
                                {message.receiver?.username?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {message.receiver?.nickname || message.receiver?.username}
                            </span>
                            {!message.is_read && <Badge variant="destructive">Unread</Badge>}
                          </div>
                          <p className="font-medium text-sm">{message.subject}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {message.content}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(message.created_at), "yyyy-MM-dd HH:mm")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessage(message);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMessage(message.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Post Details Dialog */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post Details</DialogTitle>
              <DialogDescription>
                Author: {selectedPost.author?.nickname || selectedPost.author?.username} ·{" "}
                {format(new Date(selectedPost.created_at), "yyyy-MM-dd HH:mm")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="whitespace-pre-wrap">{selectedPost.content}</p>
              </div>
              {selectedPost.images && selectedPost.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {selectedPost.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt=""
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>👍 {selectedPost.like_count} Likes</span>
                <span>💬 {selectedPost.comment_count} Comments</span>
                <Badge variant={selectedPost.status === "published" ? "default" : "secondary"}>
                  {selectedPost.status === "published" ? "Published" : "Deleted"}
                </Badge>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedPost(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeletePost(selectedPost.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
              <DialogDescription>
                Sender: {selectedMessage.sender?.nickname || selectedMessage.sender?.username} →{" "}
                Receiver: {selectedMessage.receiver?.nickname || selectedMessage.receiver?.username} ·{" "}
                {format(new Date(selectedMessage.created_at), "yyyy-MM-dd HH:mm")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={selectedMessage.is_read ? "default" : "destructive"}>
                {selectedMessage.is_read ? "Read" : "Unread"}
              </Badge>
              {selectedMessage.read_at && (
                <span className="text-xs text-muted-foreground">
                  Read at: {format(new Date(selectedMessage.read_at), "yyyy-MM-dd HH:mm")}
                </span>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Message
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
