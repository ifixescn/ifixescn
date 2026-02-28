import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, Trash2, Mail, Heart, MessageCircle, UserPlus } from "lucide-react";
import { format } from "date-fns";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getUnreadNotificationCount,
} from "@/db/api";
import type { Notification } from "@/types";

interface NotificationsTabProps {
  userId: string;
}

export default function NotificationsTab({ userId }: NotificationsTabProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const result = await getNotifications(userId);
      setNotifications(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error("Failed to load notifications:", error);
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
      const count = await getUnreadNotificationCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      loadUnreadCount();
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark",
        variant: "destructive",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications(
        notifications.map((notif) => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast({
        title: "Error",
        description: "Operation failed",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter((notif) => notif.id !== notificationId));
      loadUnreadCount();
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) return;

    try {
      await clearAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <Mail className="h-5 w-5 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case "like":
        return <Heart className="h-5 w-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      message: "Message",
      follow: "Follow",
      like: "Like",
      comment: "Comment",
      system: "System",
    };
    return labels[type] || "Notifications";
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Center</CardTitle>
              <CardDescription>
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notifications`
                  : "All notifications read"}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    !notification.is_read
                      ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        {!notification.is_read && (
                          <Badge variant="destructive">Unread</Badge>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(
                            new Date(notification.created_at),
                            "yyyy-MM-dd HH:mm"
                          )}
                        </span>
                      </div>
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.content}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        title="Delete"
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
    </div>
  );
}
