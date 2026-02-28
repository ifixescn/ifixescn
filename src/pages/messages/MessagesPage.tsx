import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  getConversation,
  sendDirectMessage,
  markConversationAsRead,
  getMessagesList,
  getProfileById,
} from "@/db/api";
import type { DirectMessageWithProfiles, Profile } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function MessagesPage() {
  const { userId: otherUserId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<DirectMessageWithProfiles[]>([]);
  const [conversations, setConversations] = useState<DirectMessageWithProfiles[]>([]);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) {
      toast({
        title: "提示",
        description: "请先登录",
        variant: "destructive",
      });
      return;
    }

    if (otherUserId) {
      loadConversation();
      loadOtherUser();
    } else {
      loadConversations();
    }
  }, [otherUserId, user]);

  const loadOtherUser = async () => {
    if (!otherUserId) return;
    try {
      const profile = await getProfileById(otherUserId);
      setOtherUser(profile);
    } catch (error) {
      console.error("加载用户信息失败:", error);
    }
  };

  const loadConversation = async () => {
    if (!otherUserId) return;
    try {
      setLoading(true);
      const data = await getConversation(otherUserId);
      setMessages(data.reverse());
      await markConversationAsRead(otherUserId);
    } catch (error) {
      console.error("加载对话失败:", error);
      toast({
        title: "错误",
        description: "加载对话失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await getMessagesList();
      setConversations(data);
    } catch (error) {
      console.error("加载消息列表失败:", error);
      toast({
        title: "错误",
        description: "加载消息列表失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId) return;

    try {
      setSending(true);
      await sendDirectMessage({
        receiver_id: otherUserId,
        content: newMessage.trim(),
      });
      setNewMessage("");
      await loadConversation();
    } catch (error) {
      console.error("发送消息失败:", error);
      toast({
        title: "错误",
        description: "发送消息失败",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">请先登录</h2>
              <Button asChild>
                <Link to="/login">前往登录</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 对话视图
  if (otherUserId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link to="/messages">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              {otherUser && (
                <>
                  <Avatar>
                    <AvatarImage src={otherUser.avatar_url || undefined} />
                    <AvatarFallback>
                      {(otherUser.nickname || otherUser.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle>{otherUser.nickname || otherUser.username}</CardTitle>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4 mb-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">暂无消息</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={isOwn ? user.user_metadata?.avatar_url : otherUser?.avatar_url || undefined} />
                          <AvatarFallback>
                            {isOwn
                              ? (user.user_metadata?.nickname || "U").charAt(0).toUpperCase()
                              : (otherUser?.nickname || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"} max-w-[70%]`}>
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}
                          >
                            <p>{msg.content}</p>
                          </div>
                          <span className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 消息列表视图
  const uniqueConversations = conversations.reduce((acc, msg) => {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!acc.find((m) => {
      const mOtherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      return mOtherId === otherId;
    })) {
      acc.push(msg);
    }
    return acc;
  }, [] as DirectMessageWithProfiles[]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>站内信</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">加载中...</p>
            </div>
          ) : uniqueConversations.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">暂无消息</p>
            </div>
          ) : (
            <div className="space-y-2">
              {uniqueConversations.map((msg) => {
                const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
                const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
                const isUnread = msg.receiver_id === user.id && !msg.is_read;

                return (
                  <Link
                    key={msg.id}
                    to={`/messages/${otherId}`}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Avatar>
                      <AvatarImage src={otherProfile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {(otherProfile?.nickname || otherProfile?.username || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-medium ${isUnread ? "font-bold" : ""}`}>
                          {otherProfile?.nickname || otherProfile?.username}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(msg.created_at), "MM-dd HH:mm")}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${isUnread ? "font-medium" : "text-muted-foreground"}`}>
                        {msg.sender_id === user.id ? "我: " : ""}
                        {msg.content}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
