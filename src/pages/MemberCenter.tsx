import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMemberPointsLog,
  getBrowsingHistory,
  getMemberSubmissions,
  getMemberQuestions,
  getMemberAnswers,
  updateMemberProfile,
  deleteBrowsingHistory,
  clearBrowsingHistory,
  getMemberLevels,
} from "@/db/api";
import type {
  MemberPointsLog,
  BrowsingHistory,
  MemberSubmission,
  QuestionWithAnswers,
  AnswerWithAuthor,
  MemberLevelConfig,
} from "@/types";
import {
  User,
  Award,
  History,
  FileText,
  MessageCircle,
  MessageSquare,
  Settings,
  LogOut,
  Trash2,
  Eye,
  Calendar,
  TrendingUp,
  Crown,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Users,
  Bell,
  Send,
  Heart,
  MessageCircleMore,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { format } from "date-fns";
import PostsTab from "@/components/member/PostsTab";
import MessagesTab from "@/components/member/MessagesTab";
import FollowsTab from "@/components/member/FollowsTab";
import NotificationsTab from "@/components/member/NotificationsTab";
import ActivityFeed from "@/components/member/ActivityFeed";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function MemberCenter() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [pointsLog, setPointsLog] = useState<MemberPointsLog[]>([]);
  const [browsingHistory, setBrowsingHistory] = useState<BrowsingHistory[]>([]);
  const [submissions, setSubmissions] = useState<MemberSubmission[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [answers, setAnswers] = useState<AnswerWithAuthor[]>([]);
  const [memberLevels, setMemberLevels] = useState<MemberLevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    loadMemberData();
  }, [user, navigate]);

  // Handle URL parameters and automatically switch tabs
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadMemberData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [
        pointsData,
        historyData,
        submissionsData,
        questionsData,
        answersData,
        levelsData,
      ] = await Promise.all([
        getMemberPointsLog(user.id),
        getBrowsingHistory(user.id),
        getMemberSubmissions(user.id),
        getMemberQuestions(user.id),
        getMemberAnswers(user.id),
        getMemberLevels(),
      ]);

      setPointsLog(pointsData);
      setBrowsingHistory(historyData);
      setSubmissions(submissionsData);
      setQuestions(questionsData);
      setAnswers(answersData);
      setMemberLevels(levelsData);
    } catch (error) {
      console.error("Failed to load member data:", error);
      toast({
        title: "Error",
        description: "Failed to load member data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setUpdating(true);
    const formData = new FormData(e.currentTarget);

    try {
      await updateMemberProfile(user.id, {
        username: formData.get("username") as string,
        nickname: formData.get("nickname") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        country: formData.get("country") as string,
        city: formData.get("city") as string,
        address: formData.get("address") as string,
        postal_code: formData.get("postal_code") as string,
        bio: formData.get("bio") as string,
      });

      await refreshProfile();

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteHistory = async (historyId: string) => {
    try {
      await deleteBrowsingHistory(historyId);
      setBrowsingHistory(browsingHistory.filter((h) => h.id !== historyId));
      toast({
        title: "Success",
        description: "Browsing history deleted",
      });
    } catch (error) {
      console.error("Failed to delete browsing history:", error);
      toast({
        title: "Error",
        description: "Failed to delete browsing history",
        variant: "destructive",
      });
    }
  };

  const handleClearHistory = async () => {
    if (!user) return;

    try {
      await clearBrowsingHistory(user.id);
      setBrowsingHistory([]);
      toast({
        title: "Success",
        description: "All browsing history cleared",
      });
    } catch (error) {
      console.error("Failed to clear browsing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear browsing history",
        variant: "destructive",
      });
    }
  };

  const getCurrentLevel = () => {
    if (!profile) return null;
    return memberLevels.find((l) => l.id === profile.level);
  };

  const getNextLevel = () => {
    if (!profile) return null;
    return memberLevels.find((l) => l.id === profile.level + 1);
  };

  const getProgressToNextLevel = () => {
    if (!profile) return 0;
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    if (!currentLevel || !nextLevel) return 100;

    const currentPoints = profile.points - currentLevel.min_points;
    const requiredPoints = nextLevel.min_points - currentLevel.min_points;
    return Math.min((currentPoints / requiredPoints) * 100, 100);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading member center...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header Info */}
      <div className="mb-8">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-center gap-3">
                  <h1 className="text-3xl font-bold">{profile.username || "Member"}</h1>
                  {currentLevel && (
                    <Badge
                      className="w-fit"
                      style={{ backgroundColor: currentLevel.badge_color }}
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      {currentLevel.name}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="text-lg font-semibold">{profile.points}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Questions</p>
                      <p className="text-lg font-semibold">{profile.total_questions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Answers</p>
                      <p className="text-lg font-semibold">{profile.total_answers}</p>
                    </div>
                  </div>
                </div>

                {nextLevel && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Upgrade to {nextLevel.name}
                      </span>
                      <span className="font-medium">
                        {profile.points} / {nextLevel.min_points}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${getProgressToNextLevel()}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 xl:grid-cols-10">
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="posts">
            <FileText className="h-4 w-4 mr-2" />
            Posts
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="follows">
            <Users className="h-4 w-4 mr-2" />
            Follows
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="points">
            <Award className="h-4 w-4 mr-2" />
            Points
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
          <TabsTrigger value="questions">
            <MessageCircle className="h-4 w-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="answers">
            <MessageSquare className="h-4 w-4 mr-2" />
            Answers
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Member Level Benefits</CardTitle>
                <CardDescription>Your current level privileges</CardDescription>
              </CardHeader>
              <CardContent>
                {currentLevel && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: currentLevel.badge_color + "20" }}
                      >
                        <Crown
                          className="h-6 w-6"
                          style={{ color: currentLevel.badge_color }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{currentLevel.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {currentLevel.benefits.description}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {currentLevel.benefits.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>Your content submission status</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No submissions yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {submissions.slice(0, 5).map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm capitalize">
                            {submission.content_type === "article" ? "Article" : 
                             submission.content_type === "question" ? "Question" : 
                             submission.content_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(submission.submitted_at), "MMM dd, yyyy")}
                          </p>
                        </div>
                        {getStatusBadge(submission.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Feed */}
          <ActivityFeed />
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Points History</CardTitle>
              <CardDescription>Track your points earned and spent</CardDescription>
            </CardHeader>
            <CardContent>
              {pointsLog.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No points records yet</p>
              ) : (
                <div className="space-y-3">
                  {pointsLog.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            log.points > 0 ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          <TrendingUp
                            className={`h-5 w-5 ${
                              log.points > 0 ? "text-green-600" : "text-red-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{log.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "MMM dd, yyyy HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          log.points > 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {log.points > 0 ? "+" : ""}
                        {log.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Browsing History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Browsing History</CardTitle>
                <CardDescription>Your recently viewed content</CardDescription>
              </div>
              {browsingHistory.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {browsingHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No browsing history</p>
              ) : (
                <div className="space-y-3">
                  {browsingHistory.map((history) => (
                    <div
                      key={history.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{history.content_title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {history.content_type === "article" ? "Article" : 
                               history.content_type === "product" ? "Product" : 
                               history.content_type === "question" ? "Q&A" : 
                               history.content_type}
                            </Badge>
                            <span>•</span>
                            <span>{format(new Date(history.created_at), "MMM dd, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteHistory(history.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>My Questions</CardTitle>
              <CardDescription>Your questions</CardDescription>
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No questions yet</p>
              ) : (
                <div className="space-y-3">
                  {questions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/questions/${question.id}`)}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{question.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(question.created_at), "MMM dd, yyyy")}</span>
                          <span>•</span>
                          <MessageSquare className="h-3 w-3" />
                          <span>{question.answer_count || 0} Answers</span>
                        </div>
                      </div>
                      {getStatusBadge(question.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Answers Tab */}
        <TabsContent value="answers">
          <Card>
            <CardHeader>
              <CardTitle>My Answers</CardTitle>
              <CardDescription>Your answers</CardDescription>
            </CardHeader>
            <CardContent>
              {answers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No answers yet</p>
              ) : (
                <div className="space-y-3">
                  {answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(answer.created_at), "MMM dd, yyyy")}</span>
                        </div>
                        {answer.is_accepted && (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Accepted
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{stripHtml(answer.content)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts">
          {user && <PostsTab userId={user.id} viewMode="timeline" />}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          {user && <MessagesTab userId={user.id} />}
        </TabsContent>

        {/* Follows Tab */}
        <TabsContent value="follows">
          {user && <FollowsTab userId={user.id} />}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          {user && <NotificationsTab userId={user.id} />}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={profile.username || ""}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      id="nickname"
                      name="nickname"
                      defaultValue={profile.nickname || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={profile.email || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={profile.phone || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={profile.country || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={profile.city || ""}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      defaultValue={profile.postal_code || ""}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    defaultValue={profile.address || ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    defaultValue={profile.bio || ""}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </form>

              {/* Profile Settings Link */}
              {["silver", "gold", "premium", "svip"].includes(profile.member_level) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-2">Profile Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage your profile visibility and display preferences
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/member/profile-settings")}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
