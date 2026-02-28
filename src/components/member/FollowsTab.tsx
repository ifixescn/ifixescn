import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, UserMinus, Mail } from "lucide-react";
import {
  getFollowingList,
  getFollowerList,
  followUser,
  unfollowUser,
  checkIsFollowing,
} from "@/db/api";
import type { MemberFollowWithProfile } from "@/types";

interface FollowsTabProps {
  userId: string;
}

export default function FollowsTab({ userId }: FollowsTabProps) {
  const { toast } = useToast();
  const [followingList, setFollowingList] = useState<MemberFollowWithProfile[]>([]);
  const [followerList, setFollowerList] = useState<MemberFollowWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFollows();
  }, [userId]);

  const loadFollows = async () => {
    try {
      setLoading(true);
      const [following, followers] = await Promise.all([
        getFollowingList(userId),
        getFollowerList(userId),
      ]);
      setFollowingList(Array.isArray(following.data) ? following.data : []);
      setFollowerList(Array.isArray(followers.data) ? followers.data : []);

      // Check if each follower is already followed
      const followerIds = followers.data.map((f: MemberFollowWithProfile) => f.follower?.id).filter(Boolean);
      const statusMap: Record<string, boolean> = {};
      await Promise.all(
        followerIds.map(async (id: string) => {
          const isFollowing = await checkIsFollowing(userId, id);
          statusMap[id] = isFollowing;
        })
      );
      setFollowingStatus(statusMap);
    } catch (error) {
      console.error("Failed to load follows:", error);
      toast({
        title: "Error",
        description: "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    try {
      await followUser(targetUserId);
      setFollowingStatus({ ...followingStatus, [targetUserId]: true });
      toast({
        title: "Success",
        description: "Followed successfully",
      });
      loadFollows();
    } catch (error) {
      console.error("Failed to follow user:", error);
      toast({
        title: "Error",
        description: "Failed to follow",
        variant: "destructive",
      });
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    try {
      await unfollowUser(targetUserId);
      setFollowingStatus({ ...followingStatus, [targetUserId]: false });
      toast({
        title: "Success",
        description: "Unfollowed",
      });
      loadFollows();
    } catch (error) {
      console.error("Failed to unfollow user:", error);
      toast({
        title: "Error",
        description: "Failed to unfollow",
        variant: "destructive",
      });
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

  const renderUserCard = (
    user: any,
    showFollowButton: boolean,
    isFollowing?: boolean
  ) => {
    if (!user) return null;

    return (
      <div className="border rounded-lg p-4 hover:bg-accent transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {user.nickname || user.username || "Unknown User"}
                </span>
                <Badge className={getMemberLevelBadge(user.member_level || "guest")}>
                  {user.member_level || "guest"}
                </Badge>
              </div>
              {user.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {user.bio}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Follow {user.following_count || 0}</span>
                <span>Followers {user.follower_count || 0}</span>
                <span>Posts {user.post_count || 0}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {showFollowButton && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={() =>
                  isFollowing ? handleUnfollow(user.id) : handleFollow(user.id)
                }
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4 mr-1" />
                    CancelFollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
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
      <Card>
        <CardHeader>
          <CardTitle>Follows & Followers</CardTitle>
          <CardDescription>Manage your social connections</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="following">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="following">
                <Users className="h-4 w-4 mr-2" />
                Follow ({followingList.length})
              </TabsTrigger>
              <TabsTrigger value="followers">
                <Users className="h-4 w-4 mr-2" />
                Followers ({followerList.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="following" className="mt-4 space-y-3">
              {followingList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  You haven't followed anyone yet
                </p>
              ) : (
                followingList.map((follow) =>
                  renderUserCard(follow.following, true, true)
                )
              )}
            </TabsContent>

            <TabsContent value="followers" className="mt-4 space-y-3">
              {followerList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No one is following you yet
                </p>
              ) : (
                followerList.map((follow) => {
                  const followerId = follow.follower?.id;
                  return renderUserCard(
                    follow.follower,
                    true,
                    followerId ? followingStatus[followerId] : false
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
