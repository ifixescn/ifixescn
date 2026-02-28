import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  getInboxMessages,
  getSentMessages,
  sendMessage,
  markMessageAsRead,
  deleteMessage,
  getUnreadMessageCount,
} from "@/db/api";
import type { MessageWithProfiles } from "@/types";

interface MessagesTabProps {
  userId: string;
}

export default function MessagesTab({ userId }: MessagesTabProps) {
  const { toast } = useToast();
  const [inboxMessages, setInboxMessages] = useState<MessageWithProfiles[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithProfiles | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Send Message Form
  const [newMessage, setNewMessage] = useState({
    receiverId: "",
    subject: "",
    content: "",
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, [userId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const [inbox, sent] = await Promise.all([
        getInboxMessages(userId),
        getSentMessages(userId),
      ]);
      setInboxMessages(Array.isArray(inbox.data) ? inbox.data : []);
      setSentMessages(Array.isArray(sent.data) ? sent.data : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      toast({
        title: "Error",
        description: "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadMessageCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.receiverId || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Notice",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      await sendMessage(
        userId,
        newMessage.receiverId,
        newMessage.subject,
        newMessage.content
      );
      setNewMessage({ receiverId: "", subject: "", content: "" });
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Message sent",
      });
      loadMessages();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await markMessageAsRead(messageId);
      setInboxMessages(
        inboxMessages.map((msg) =>
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
      loadUnreadCount();
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string, type: "inbox" | "sent") => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      await deleteMessage(messageId);
      if (type === "inbox") {
        setInboxMessages(inboxMessages.filter((msg) => msg.id !== messageId));
      } else {
        setSentMessages(sentMessages.filter((msg) => msg.id !== messageId));
      }
      toast({
        title: "Success",
        description: "Message deleted",
      });
      loadUnreadCount();
    } catch (error) {
      console.error("Failed to delete message:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleViewMessage = (message: MessageWithProfiles) => {
    setSelectedMessage(message);
    if (!message.is_read && message.receiver_id === userId) {
      handleMarkAsRead(message.id);
    }
  };

  const renderMessageList = (messages: MessageWithProfiles[], type: "inbox" | "sent") => {
    if (messages.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No messages yet</p>;
    }

    return (
      <div className="space-y-2">
        {messages.map((message) => {
          const otherUser = type === "inbox" ? message.sender : message.receiver;
          return (
            <div
              key={message.id}
              className={`border rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors ${
                !message.is_read && type === "inbox" ? "bg-blue-50 dark:bg-blue-950" : ""
              }`}
              onClick={() => handleViewMessage(message)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar>
                    <AvatarImage src={otherUser?.avatar_url || undefined} />
                    <AvatarFallback>
                      {otherUser?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {type === "inbox" ? "From: " : "To: "}
                        {otherUser?.nickname || otherUser?.username || "Unknown User"}
                      </span>
                      {!message.is_read && type === "inbox" && (
                        <Badge variant="destructive">Unread</Badge>
                      )}
                    </div>
                    <p className="font-medium text-sm mt-1 truncate">{message.subject}</p>
                    <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(message.created_at), "yyyy-MM-dd HH:mm")}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(message.id, type);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
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
      {/* Action Bar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `You have ${unreadCount} unread messages` : "All messages read"}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send New Message</DialogTitle>
                  <DialogDescription>Send a private message to another member</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="receiverId">Receiver ID</Label>
                    <Input
                      id="receiverId"
                      placeholder="Enter receiver's user ID"
                      value={newMessage.receiverId}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, receiverId: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Message subject"
                      value={newMessage.subject}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, subject: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Message content"
                      value={newMessage.content}
                      onChange={(e) =>
                        setNewMessage({ ...newMessage, content: e.target.value })
                      }
                      rows={6}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendMessage} disabled={isSending}>
                    {isSending ? "Sending..." : "Send"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* 消息列表 */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="inbox">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="inbox">
                <Mail className="h-4 w-4 mr-2" />
                Inbox {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="sent">
                <Send className="h-4 w-4 mr-2" />
                Sent
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inbox" className="mt-4">
              {renderMessageList(inboxMessages, "inbox")}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              {renderMessageList(sentMessages, "sent")}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      {selectedMessage && (
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedMessage.subject}</DialogTitle>
              <DialogDescription>
                {selectedMessage.sender_id === userId ? "To: " : "From: "}
                {(selectedMessage.sender_id === userId
                  ? selectedMessage.receiver?.nickname || selectedMessage.receiver?.username
                  : selectedMessage.sender?.nickname || selectedMessage.sender?.username) || "Unknown User"}
                {" · "}
                {format(new Date(selectedMessage.created_at), "yyyy-MM-dd HH:mm")}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedMessage(null)}>
                Close
              </Button>
              {selectedMessage.sender_id !== userId && (
                <Button
                  onClick={() => {
                    setNewMessage({
                      receiverId: selectedMessage.sender_id,
                      subject: `Re: ${selectedMessage.subject}`,
                      content: "",
                    });
                    setSelectedMessage(null);
                    setIsDialogOpen(true);
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Reply
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
