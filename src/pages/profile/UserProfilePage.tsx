import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfileData, followUser, unfollowUser, canViewProfile } from "@/db/api";
import type { UserProfileData } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  Mail,
  UserPlus,
  UserMinus,
  MessageSquare,
  Lock,
} from "lucide-react";
import { format } from "date-fns";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [canView, setCanView] = useState(true);

  useEffect(() => {
    if (userId) {
      checkAccessAndLoadProfile();
    }
  }, [userId, user]);

  const checkAccessAndLoadProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      
      // Check access permission
      const hasAccess = await canViewProfile(user?.id || null, userId);
      setCanView(hasAccess);
      
      if (!hasAccess) {
        setLoading(false);
        return;
      }

      // Load user profile data
      const data = await getUserProfileData(userId);
      setProfileData(data);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await getUserProfileData(userId);
      setProfileData(data);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      toast({
        title: "Notice",
        description: "Please login first",
        variant: "destructive",
      });
      return;
    }

    if (!userId) return;

    try {
      setActionLoading(true);
      if (profileData?.is_following) {
        await unfollowUser(userId);
        toast({
          title: "Success",
          description: "Unfollowed successfully",
        });
      } else {
        await followUser(userId);
        toast({
          title: "Success",
          description: "Followed successfully",
        });
      }
      await loadProfileData();
    } catch (error) {
      console.error("Operation failed:", error);
      toast({
        title: "Error",
        description: "Operation failed, please try again",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getMemberLevelBadge = (level: string) => {
    const levelConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      bronze: { label: "Bronze", variant: "outline" },
      silver: { label: "Silver", variant: "secondary" },
      gold: { label: "Gold", variant: "default" },
      premium: { label: "Premium", variant: "default" },
      svip: { label: "SVIP", variant: "default" },
    };

    const config = levelConfig[level] || { label: level, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Lock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                This user's profile is set to private or friends only
              </p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
              <p className="text-muted-foreground mb-4">This user may have been deleted or does not exist</p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, articles, questions, sns_posts, is_following, is_friend, followers_count, following_count } = profileData;

  // Only Silver and above members can display personal homepage
  const hasProfileAccess = ["silver", "gold", "premium", "svip"].includes(profile.member_level);

  if (!hasProfileAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Profile Not Available</h2>
              <p className="text-muted-foreground mb-4">This user needs to verify their email and upgrade to Silver membership to enable their profile</p>
              <Button asChild>
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* User Information Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col items-center xl:items-start gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.nickname || profile.username || "User"} />
                <AvatarFallback className="text-3xl">
                  {(profile.nickname || profile.username || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {!isOwnProfile && user && (
                <div className="flex gap-2 w-full">
                  <Button
                    onClick={handleFollow}
                    disabled={actionLoading}
                    variant={is_following ? "outline" : "default"}
                    className="flex-1"
                  >
                    {is_following ? (
                      <>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                  {is_friend && (
                    <Button asChild variant="outline">
                      <Link to={`/messages/${userId}`}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Detailed Information */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.nickname || profile.username}</h1>
                {getMemberLevelBadge(profile.member_level)}
                {profile.email_verified && (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    ✓ Verified
                  </Badge>
                )}
              </div>

              {profile.bio && (
                <p className="text-muted-foreground mb-4">{profile.bio}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LinkIcon className="h-4 w-4" />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {format(new Date(profile.created_at), "MMM yyyy")}</span>
                </div>
                {profile.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{profile.email}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{followers_count}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{following_count}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.total_articles}</div>
                  <div className="text-sm text-muted-foreground">Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{profile.total_questions}</div>
                  <div className="text-sm text-muted-foreground">Q&A</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="articles">
            <FileText className="mr-2 h-4 w-4" />
            Articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageCircle className="mr-2 h-4 w-4" />
            Q&A ({questions.length})
          </TabsTrigger>
          <TabsTrigger value="sns">
            <Users className="mr-2 h-4 w-4" />
            Posts ({sns_posts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-6">
          {articles.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No articles yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {articles.map((article) => (
                <Card key={article.id}>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/articles/${article.slug}`} className="hover:text-primary">
                        {article.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {article.excerpt && (
                      <p className="text-muted-foreground mb-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(article.created_at), "yyyy-MM-dd")}</span>
                      <span>{article.view_count} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="mt-6">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No Q&A yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id}>
                  <CardHeader>
                    <CardTitle>
                      <Link to={`/questions/${question.id}`} className="hover:text-primary">
                        {question.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{format(new Date(question.created_at), "yyyy-MM-dd")}</span>
                      <span>{question.answer_count || 0} answers</span>
                      <span>{question.view_count} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sns" className="mt-6">
          {sns_posts.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">No posts yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sns_posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <p className="mb-2">{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        {post.images.slice(0, 9).map((img, idx) => (
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
                      <span>{format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}</span>
                      <span>{post.like_count || 0} likes</span>
                      <span>{post.comment_count || 0} comments</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
