import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import {
  getAllMembersWithStats,
  searchMembers,
  updateMemberProfile,
  addMemberPoints,
  getMemberLevels,
  getAllMemberSubmissions,
  updateSubmissionStatus,
  getMemberPointsLog,
  getBrowsingHistory,
  getMemberArticles,
  getMemberQuestions,
  getMemberAnswers,
  getMemberLeaderboard,
  toggleMemberStatus,
  batchUpdateMemberLevel,
  batchAddPoints,
  getPointsRules,
  updatePointsRule,
  getMembersStatsSummary,
  getMembersByStatus,
  deleteMember,
  getAllProfiles,
  updateUserRole,
  updateMemberLevel,
  adminSetEmailVerified,
  adminUpdateUserEmail,
  adminUpdateUserPassword,
} from "@/db/api";
import type {
  MemberStats,
  Profile,
  MemberLevelConfig,
  MemberSubmission,
  MemberPointsLog,
  BrowsingHistory,
  ArticleWithAuthor,
  QuestionWithAnswers,
  AnswerWithAuthor,
  MemberLeaderboard,
  PointsRule,
} from "@/types";
import {
  Users,
  Search,
  Pencil,
  Award,
  Crown,
  Star,
  FileText,
  MessageCircle,
  MessageSquare,
  Eye,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Plus,
  Minus,
  Filter,
  Trophy,
  Ban,
  Unlock,
  Trash2,
  Settings,
  BarChart3,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function MembersManage() {
  const [members, setMembers] = useState<MemberStats[]>([]);
  const [memberLevels, setMemberLevels] = useState<MemberLevelConfig[]>([]);
  const [submissions, setSubmissions] = useState<MemberSubmission[]>([]);
  const [leaderboard, setLeaderboard] = useState<MemberLeaderboard[]>([]);
  const [pointsRules, setPointsRules] = useState<PointsRule[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]); // 用于角色管理
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<MemberStats | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pointsDialogOpen, setPointsDialogOpen] = useState(false);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [pointsRulesDialogOpen, setPointsRulesDialogOpen] = useState(false);
  const [levelEditDialogOpen, setLevelEditDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<MemberLevelConfig | null>(null);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const [selectedSubmission, setSelectedSubmission] = useState<MemberSubmission | null>(null);
  const [statsSum, setStatsSum] = useState({
    total: 0,
    active: 0,
    disabled: 0,
    suspended: 0,
    totalPoints: 0,
    totalArticles: 0,
    totalQuestions: 0,
    totalAnswers: 0,
  });
  const { toast } = useToast();
  const { profile } = useAuth();

  // 会员详情数据
  const [memberPointsLog, setMemberPointsLog] = useState<MemberPointsLog[]>([]);
  const [memberHistory, setMemberHistory] = useState<BrowsingHistory[]>([]);
  const [memberArticles, setMemberArticles] = useState<ArticleWithAuthor[]>([]);
  const [memberQuestions, setMemberQuestions] = useState<QuestionWithAnswers[]>([]);
  const [memberAnswers, setMemberAnswers] = useState<AnswerWithAuthor[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersData, levelsData, submissionsData, leaderboardData, rulesData, summaryData, usersData] = await Promise.all([
        getAllMembersWithStats(),
        getMemberLevels(),
        getAllMemberSubmissions(),
        getMemberLeaderboard(10, "points"),
        getPointsRules(),
        getMembersStatsSummary(),
        getAllProfiles(),
      ]);

      setMembers(Array.isArray(membersData) ? membersData : []);
      setMemberLevels(Array.isArray(levelsData) ? levelsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
      setPointsRules(Array.isArray(rulesData) ? rulesData : []);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setStatsSum(summaryData);
    } catch (error) {
      console.error("加载会员列表失败:", error);
      toast({ title: "错误", description: "加载会员列表失败", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    try {
      const results = await searchMembers(searchTerm);
      // 将搜索结果转换为 MemberStats 格式
      const statsResults = results.map(r => ({
        ...r,
        nickname: r.nickname || null,
        phone: r.phone || null,
        level_name: "",
        badge_color: "",
        total_articles: r.total_articles || 0,
        total_questions: r.total_questions || 0,
        total_answers: r.total_answers || 0,
        last_login_at: r.last_login_at || null,
        total_views: 0,
        pending_submissions: 0,
      })) as MemberStats[];
      setMembers(statsResults);
    } catch (error) {
      console.error("搜索会员失败:", error);
      toast({ title: "错误", description: "搜索会员失败", variant: "destructive" });
    }
  };

  const handleUpdateMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.currentTarget);
    const level = parseInt(formData.get("level") as string);
    const role = formData.get("role") as "admin" | "editor" | "user";
    const newEmail = formData.get("email") as string;
    const newPassword = formData.get("new-password") as string;

    try {
      // 检查邮箱是否变更
      if (newEmail && newEmail !== selectedMember.email) {
        await adminUpdateUserEmail(selectedMember.id, newEmail, "管理员更新邮箱");
        toast({ 
          title: "提示", 
          description: "邮箱已更新，用户需要重新验证邮箱" 
        });
      }

      // 检查是否需要更新密码
      if (newPassword && newPassword.trim() !== "") {
        await adminUpdateUserPassword(selectedMember.id, newPassword, "管理员重置密码");
        toast({ 
          title: "提示", 
          description: "密码已重置，操作已记录" 
        });
      }

      await updateMemberProfile(selectedMember.id, {
        level,
        role: role as any,
        nickname: formData.get("nickname") as string,
        phone: formData.get("phone") as string,
      });

      toast({ title: "成功", description: "会员信息更新成功" });
      setEditDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("更新会员信息失败:", error);
      toast({ title: "错误", description: "更新会员信息失败", variant: "destructive" });
    }
  };

  const handleAddPoints = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.currentTarget);
    const points = parseInt(formData.get("points") as string);
    const reason = formData.get("reason") as string;

    try {
      await addMemberPoints(selectedMember.id, points, reason);
      toast({ title: "Success", description: "Points operation completed successfully" });
      setPointsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Points operation failed:", error);
      toast({ title: "Error", description: "Points operation failed", variant: "destructive" });
    }
  };

  // 设置邮箱验证状态
  const handleSetEmailVerified = async (userId: string, verified: boolean) => {
    try {
      console.log("开始设置邮箱验证状态:", { userId, verified });
      const result = await adminSetEmailVerified(userId, verified, verified ? "管理员手动验证" : "管理员取消验证");
      console.log("设置邮箱验证状态成功:", result);
      toast({ 
        title: "成功", 
        description: verified ? "邮箱已标记为已验证" : "邮箱验证状态已取消" 
      });
      loadData();
    } catch (error: any) {
      console.error("设置邮箱验证状态失败:", error);
      console.error("错误详情:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({ 
        title: "错误", 
        description: error.message || "设置邮箱验证状态失败", 
        variant: "destructive" 
      });
    }
  };

  // 会员等级编辑函数
  const handleEditLevel = (level: MemberLevelConfig) => {
    setSelectedLevel(level);
    setLevelEditDialogOpen(true);
  };

  const handleUpdateLevel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedLevel) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const minPoints = parseInt(formData.get("min_points") as string);
    const maxPoints = formData.get("max_points") as string;
    const badgeColor = formData.get("badge_color") as string;
    const description = formData.get("description") as string;
    const features = formData.get("features") as string;

    try {
      await updateMemberLevel(selectedLevel.id.toString(), {
        name,
        min_points: minPoints,
        max_points: maxPoints ? parseInt(maxPoints) : null,
        badge_color: badgeColor,
        benefits: {
          description,
          features: features.split("\n").filter((f) => f.trim()),
        },
      });
      toast({ title: "成功", description: "会员等级配置已更新" });
      setLevelEditDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("更新会员等级失败:", error);
      toast({ title: "错误", description: "更新会员等级失败", variant: "destructive" });
    }
  };

  // 角色管理函数
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      toast({ title: "成功", description: "用户角色更新成功" });
      loadData();
    } catch (error) {
      console.error("更新角色失败:", error);
      toast({ title: "错误", description: "更新角色失败", variant: "destructive" });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">管理员</Badge>;
      case "editor":
        return <Badge variant="secondary">编辑</Badge>;
      case "member":
        return <Badge variant="outline">会员</Badge>;
      default:
        return <Badge variant="outline">访客</Badge>;
    }
  };

  const handleReviewSubmission = async (status: "approved" | "rejected", note?: string) => {
    if (!selectedSubmission || !profile) return;

    try {
      await updateSubmissionStatus(selectedSubmission.id, status, profile.id, note);
      toast({ 
        title: "成功", 
        description: status === "approved" ? "内容已通过审核" : "内容已拒绝" 
      });
      setSubmissionDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("审核失败:", error);
      toast({ title: "错误", description: "审核失败", variant: "destructive" });
    }
  };

  // 新增：切换会员状态
  const handleToggleStatus = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMember) return;

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as "active" | "disabled" | "suspended";
    const reason = formData.get("reason") as string;

    try {
      await toggleMemberStatus(selectedMember.id, status, reason);
      toast({ title: "成功", description: "会员状态已更新" });
      setStatusDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("更新状态失败:", error);
      toast({ title: "错误", description: "更新状态失败", variant: "destructive" });
    }
  };

  // 新增：批量操作
  const handleBatchOperation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedMembers.length === 0) {
      toast({ title: "提示", description: "请先选择会员", variant: "destructive" });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const operation = formData.get("operation") as string;

    try {
      if (operation === "level") {
        const level = parseInt(formData.get("level") as string);
        await batchUpdateMemberLevel(selectedMembers, level);
        toast({ title: "Success", description: `Successfully updated level for ${selectedMembers.length} members` });
      } else if (operation === "points") {
        const points = parseInt(formData.get("points") as string);
        const reason = formData.get("reason") as string;
        await batchAddPoints(selectedMembers, points, reason);
        toast({ title: "Success", description: `Successfully added points for ${selectedMembers.length} members` });
      }

      setBatchDialogOpen(false);
      setSelectedMembers([]);
      loadData();
    } catch (error) {
      console.error("Batch operation failed:", error);
      toast({ title: "Error", description: "Batch operation failed", variant: "destructive" });
    }
  };

  // 新增：删除会员
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm("确定要删除此会员吗？此操作不可恢复！")) return;

    try {
      await deleteMember(memberId);
      toast({ title: "成功", description: "会员已删除" });
      loadData();
    } catch (error) {
      console.error("删除会员失败:", error);
      toast({ title: "错误", description: "删除会员失败", variant: "destructive" });
    }
  };

  // 新增：更新积分规则
  const handleUpdatePointsRule = async (rule: PointsRule, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const points = parseInt(formData.get("points") as string);
    const description = formData.get("description") as string;
    const enabled = formData.get("enabled") === "true";

    try {
      await updatePointsRule(rule.action, points, description, enabled);
      toast({ title: "Success", description: "Points rule updated successfully" });
      loadData();
    } catch (error) {
      console.error("Failed to update points rule:", error);
      toast({ title: "Error", description: "Failed to update points rule", variant: "destructive" });
    }
  };

  // 切换会员选择
  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedMembers.length === filteredMembers.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(filteredMembers.map(m => m.id));
    }
  };


  const loadMemberDetails = async (member: MemberStats) => {
    setSelectedMember(member);
    setMemberDetailOpen(true);

    try {
      const [pointsLog, history, articles, questions, answers] = await Promise.all([
        getMemberPointsLog(member.id, 20),
        getBrowsingHistory(member.id, 20),
        getMemberArticles(member.id, 20),
        getMemberQuestions(member.id, 20),
        getMemberAnswers(member.id, 20),
      ]);

      setMemberPointsLog(pointsLog);
      setMemberHistory(history);
      setMemberArticles(articles);
      setMemberQuestions(questions);
      setMemberAnswers(answers);
    } catch (error) {
      console.error("加载会员详情失败:", error);
      toast({ title: "错误", description: "加载会员详情失败", variant: "destructive" });
    }
  };

  const getLevelBadge = (levelId: number) => {
    const level = memberLevels.find(l => l.id === levelId);
    if (!level) return null;

    return (
      <Badge style={{ backgroundColor: level.badge_color }}>
        <Crown className="h-3 w-3 mr-1" />
        {level.name}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />待审核</Badge>;
      case "approved":
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" />已通过</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredMembers = members.filter(member => {
    if (filterLevel !== "all" && member.level !== parseInt(filterLevel)) return false;
    if (filterRole !== "all" && member.role !== filterRole) return false;
    if (filterStatus !== "all" && member.status !== filterStatus) return false;
    return true;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pendingSubmissions = submissions.filter(s => s.status === "pending");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载会员数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总会员数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsSum.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              活跃: {statsSum.active} | 禁用: {statsSum.disabled}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总积分</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsSum.totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              待审核: {pendingSubmissions.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总文章数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsSum.totalArticles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总问答数</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsSum.totalQuestions + statsSum.totalAnswers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              提问: {statsSum.totalQuestions} | 回答: {statsSum.totalAnswers}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            会员列表
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            角色管理
          </TabsTrigger>
          <TabsTrigger value="submissions">
            <FileText className="h-4 w-4 mr-2" />
            内容审核
            {pendingSubmissions.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingSubmissions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            <Trophy className="h-4 w-4 mr-2" />
            排行榜
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            系统设置
          </TabsTrigger>
        </TabsList>

        {/* 会员列表标签 */}
        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>会员管理</CardTitle>
              <CardDescription>管理所有会员信息、积分和权限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 搜索和筛选 */}
              <div className="flex flex-col xl:flex-row gap-4">
                <div className="flex-1 flex gap-2">
                  <Input
                    placeholder="搜索会员（用户名或邮箱）..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    搜索
                  </Button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="筛选等级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有等级</SelectItem>
                      {memberLevels.map(level => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="筛选角色" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有角色</SelectItem>
                      <SelectItem value="member">会员</SelectItem>
                      <SelectItem value="editor">编辑</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="筛选状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">所有状态</SelectItem>
                      <SelectItem value="active">正常</SelectItem>
                      <SelectItem value="disabled">禁用</SelectItem>
                      <SelectItem value="suspended">暂停</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedMembers.length > 0 && (
                    <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          <Users className="h-4 w-4 mr-2" />
                          批量操作 ({selectedMembers.length})
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>批量操作</DialogTitle>
                          <DialogDescription>
                            已选择 {selectedMembers.length} 位会员
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleBatchOperation} className="space-y-4">
                          <div>
                            <Label>操作类型</Label>
                            <Select name="operation" required>
                              <SelectTrigger>
                                <SelectValue placeholder="选择操作" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="level">批量修改等级</SelectItem>
                                <SelectItem value="points">批量增加积分</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>等级（如选择修改等级）</Label>
                            <Select name="level">
                              <SelectTrigger>
                                <SelectValue placeholder="选择等级" />
                              </SelectTrigger>
                              <SelectContent>
                                {memberLevels.map(level => (
                                  <SelectItem key={level.id} value={level.id.toString()}>
                                    {level.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>积分（如选择增加积分）</Label>
                            <Input type="number" name="points" placeholder="输入积分数" />
                          </div>
                          <div>
                            <Label>原因</Label>
                            <Input name="reason" placeholder="操作原因" />
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setBatchDialogOpen(false)}>
                              取消
                            </Button>
                            <Button type="submit">确认操作</Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* 全选按钮 */}
              {filteredMembers.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedMembers.length === filteredMembers.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <Label className="cursor-pointer" onClick={toggleSelectAll}>
                    全选 ({filteredMembers.length} 位会员)
                  </Label>
                </div>
              )}

              {/* 会员列表 */}
              <div className="space-y-3">
                {filteredMembers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">未找到会员</p>
                ) : (
                  <>
                    {paginatedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <Checkbox
                            checked={selectedMembers.includes(member.id)}
                            onCheckedChange={() => toggleMemberSelection(member.id)}
                          />
                          
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.avatar_url || undefined} />
                            <AvatarFallback>
                              {member.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{member.username}</h3>
                              {getLevelBadge(member.level)}
                              {getRoleBadge(member.role)}
                              {getStatusBadge(member.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {member.points} 积分
                              </span>
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {member.total_articles} 文章
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {member.total_questions} 提问
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {member.total_answers} 回答
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadMemberDetails(member)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            查看
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            编辑
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setPointsDialogOpen(true);
                            }}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            积分
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setStatusDialogOpen(true);
                            }}
                          >
                            {member.status === "active" ? (
                              <><Ban className="h-4 w-4 mr-2" />禁用</>
                            ) : (
                              <><Unlock className="h-4 w-4 mr-2" />启用</>
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {/* 分页组件 */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex justify-center">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {generatePageNumbers().map((page, index) => (
                              <PaginationItem key={`page-${index}`}>
                                {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                  <PaginationEllipsis />
                                ) : (
                                  <PaginationLink
                                    onClick={() => handlePageChange(page as number)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                )}
                              </PaginationItem>
                            ))}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 内容审核标签 */}
        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>内容审核</CardTitle>
              <CardDescription>审核会员提交的内容</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无提交内容</p>
              ) : (
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="capitalize">
                            {submission.content_type === "article" ? "文章" : 
                             submission.content_type === "question" ? "提问" : 
                             submission.content_type}
                          </Badge>
                          {getStatusBadge(submission.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          提交时间: {format(new Date(submission.submitted_at), "yyyy年MM月dd日 HH:mm")}
                        </p>
                        {submission.reviewed_at && (
                          <p className="text-sm text-muted-foreground">
                            审核时间: {format(new Date(submission.reviewed_at), "yyyy年MM月dd日 HH:mm")}
                          </p>
                        )}
                        {submission.review_note && (
                          <p className="text-sm text-muted-foreground mt-1">
                            审核备注: {submission.review_note}
                          </p>
                        )}
                      </div>

                      {submission.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubmission(submission);
                              setSubmissionDialogOpen(true);
                            }}
                          >
                            审核
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 排行榜标签 */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>会员排行榜</CardTitle>
              <CardDescription>积分排名前10的会员</CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无排行数据</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 font-bold">
                        {index + 1}
                      </div>

                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback>
                          {member.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{member.username}</h3>
                          {getLevelBadge(member.level)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {member.points} 积分
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {member.total_articles} 文章
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {member.total_questions} 提问
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {member.total_answers} 回答
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 角色管理标签页 */}
        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle>用户角色管理</CardTitle>
              <CardDescription>管理所有用户的系统角色和权限</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {user.username?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{user.username || "未设置用户名"}</h3>
                          {getRoleBadge(user.role)}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              邮箱: {user.email}
                              {user.email_verified ? (
                                <Badge variant="default" className="text-xs px-1 py-0">已验证</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs px-1 py-0">未验证</Badge>
                              )}
                            </span>
                          )}
                          {user.phone && <span> | 手机: {user.phone}</span>}
                          <span> | 注册: {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">管理员</SelectItem>
                          <SelectItem value="editor">编辑</SelectItem>
                          <SelectItem value="member">会员</SelectItem>
                          <SelectItem value="visitor">访客</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
                {allUsers.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    暂无用户
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>角色说明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Badge variant="default">管理员</Badge>
                  <span className="text-muted-foreground">拥有系统所有权限，可管理所有内容和用户</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="secondary">编辑</Badge>
                  <span className="text-muted-foreground">可发布和管理内容，审核问答，但不能管理用户</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">会员</Badge>
                  <span className="text-muted-foreground">可提问、回答问题，查看已发布内容</span>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline">访客</Badge>
                  <span className="text-muted-foreground">只能浏览公开内容</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统设置标签页 */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>积分规则设置</CardTitle>
              <CardDescription>配置会员积分获取规则</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointsRules.map((rule) => (
                  <div key={rule.action} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{rule.description}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "启用" : "禁用"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">操作: {rule.action}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">{rule.points}</div>
                        <div className="text-xs text-muted-foreground">积分</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPoints = prompt("请输入新的积分值:", rule.points.toString());
                          if (newPoints !== null) {
                            updatePointsRule(rule.action, parseInt(newPoints), rule.description, rule.enabled)
                              .then(() => {
                                toast({ title: "成功", description: "积分规则已更新" });
                                loadData();
                              })
                              .catch((error) => {
                                console.error("更新积分规则失败:", error);
                                toast({ title: "错误", description: "更新积分规则失败", variant: "destructive" });
                              });
                          }
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        编辑
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>会员等级配置</CardTitle>
              <CardDescription>管理会员等级要求和权益</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberLevels.map((level) => (
                  <div key={level.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: level.badge_color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{level.name}</h4>
                          {getLevelBadge(level.id)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          积分范围: {level.min_points} - {level.max_points || "无上限"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {level.benefits?.description || "暂无描述"}
                        </p>
                        {level.benefits?.features && level.benefits.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {level.benefits.features.map((feature, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditLevel(level)}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      编辑
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 编辑会员对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑会员信息</DialogTitle>
            <DialogDescription>更新会员的等级、角色和基本信息</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  defaultValue={selectedMember.nickname || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={selectedMember.email || ""}
                    className="flex-1"
                  />
                  {selectedMember.email_verified ? (
                    <Badge variant="default" className="self-center">已验证</Badge>
                  ) : (
                    <Badge variant="secondary" className="self-center">未验证</Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {!selectedMember.email_verified && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetEmailVerified(selectedMember.id, true)}
                    >
                      标记为已验证
                    </Button>
                  )}
                  {selectedMember.email_verified && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetEmailVerified(selectedMember.id, false)}
                    >
                      取消验证
                    </Button>
                  )}
                </div>
                {selectedMember.email_verified_at && (
                  <p className="text-xs text-muted-foreground">
                    验证时间: {new Date(selectedMember.email_verified_at).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">电话</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={selectedMember.phone || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">新密码（留空则不修改）</Label>
                <Input
                  id="new-password"
                  name="new-password"
                  type="password"
                  placeholder="输入新密码（至少6个字符）"
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  如需重置用户密码，请输入新密码。留空则不修改密码。
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">会员等级</Label>
                <Select name="level" defaultValue={selectedMember.level.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {memberLevels.map(level => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">角色</Label>
                <Select name="role" defaultValue={selectedMember.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">会员</SelectItem>
                    <SelectItem value="editor">编辑</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 积分管理对话框 */}
      <Dialog open={pointsDialogOpen} onOpenChange={setPointsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>积分管理</DialogTitle>
            <DialogDescription>
              为会员 {selectedMember?.username} 增加或减少积分
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <form onSubmit={handleAddPoints} className="space-y-4">
              <div className="space-y-2">
                <Label>当前积分</Label>
                <div className="text-2xl font-bold text-primary">{selectedMember.points}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">积分变动（正数增加，负数减少）</Label>
                <Input
                  id="points"
                  name="points"
                  type="number"
                  placeholder="例如: 100 或 -50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">原因</Label>
                <Input
                  id="reason"
                  name="reason"
                  placeholder="积分变动原因"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPointsDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">确认</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 内容审核对话框 */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>内容审核</DialogTitle>
            <DialogDescription>审核会员提交的内容</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>内容类型</Label>
                <Badge variant="outline" className="capitalize">
                  {selectedSubmission.content_type === "article" ? "文章" : 
                   selectedSubmission.content_type === "question" ? "提问" : 
                   selectedSubmission.content_type}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label>提交时间</Label>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedSubmission.submitted_at), "yyyy年MM月dd日 HH:mm")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_note">审核备注（可选）</Label>
                <Input
                  id="review_note"
                  placeholder="添加审核备注..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSubmissionDialogOpen(false)}
                >
                  取消
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    const note = (document.getElementById("review_note") as HTMLInputElement)?.value;
                    handleReviewSubmission("rejected", note);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  拒绝
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const note = (document.getElementById("review_note") as HTMLInputElement)?.value;
                    handleReviewSubmission("approved", note);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  通过
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 会员详情对话框 */}
      <Dialog open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>会员详情</DialogTitle>
            <DialogDescription>查看会员的详细信息和活动记录</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <Tabs defaultValue="info" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="info">基本信息</TabsTrigger>
                <TabsTrigger value="points">积分记录</TabsTrigger>
                <TabsTrigger value="history">浏览记录</TabsTrigger>
                <TabsTrigger value="articles">文章</TabsTrigger>
                <TabsTrigger value="qa">问答</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedMember.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl">
                      {selectedMember.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{selectedMember.username}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getLevelBadge(selectedMember.level)}
                      {getRoleBadge(selectedMember.role)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>邮箱</Label>
                    <p className="text-sm">{selectedMember.email || "未设置"}</p>
                  </div>
                  <div>
                    <Label>电话</Label>
                    <p className="text-sm">{selectedMember.phone || "未设置"}</p>
                  </div>
                  <div>
                    <Label>国家</Label>
                    <p className="text-sm">{selectedMember.country || "未设置"}</p>
                  </div>
                  <div>
                    <Label>城市</Label>
                    <p className="text-sm">{selectedMember.city || "未设置"}</p>
                  </div>
                  <div>
                    <Label>注册时间</Label>
                    <p className="text-sm">
                      {format(new Date(selectedMember.created_at), "yyyy年MM月dd日")}
                    </p>
                  </div>
                  <div>
                    <Label>最后登录</Label>
                    <p className="text-sm">
                      {selectedMember.last_login_at 
                        ? format(new Date(selectedMember.last_login_at), "yyyy年MM月dd日")
                        : "未知"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{selectedMember.points}</div>
                    <div className="text-sm text-muted-foreground">积分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">{selectedMember.total_articles}</div>
                    <div className="text-sm text-muted-foreground">文章</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{selectedMember.total_questions}</div>
                    <div className="text-sm text-muted-foreground">提问</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">{selectedMember.total_answers}</div>
                    <div className="text-sm text-muted-foreground">回答</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="points">
                <div className="space-y-3">
                  {memberPointsLog.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无积分记录</p>
                  ) : (
                    memberPointsLog.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{log.reason}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "yyyy年MM月dd日 HH:mm")}
                          </p>
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
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-3">
                  {memberHistory.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无浏览记录</p>
                  ) : (
                    memberHistory.map((history) => (
                      <div key={history.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{history.content_title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Badge variant="outline" className="capitalize">
                            {history.content_type === "article" ? "文章" : 
                             history.content_type === "product" ? "产品" : 
                             history.content_type}
                          </Badge>
                          <span>•</span>
                          <span>{format(new Date(history.created_at), "yyyy年MM月dd日")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="articles">
                <div className="space-y-3">
                  {memberArticles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无文章</p>
                  ) : (
                    memberArticles.map((article) => (
                      <div key={article.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{article.title}</h4>
                          <Badge variant={article.status === "published" ? "default" : "outline"}>
                            {article.status === "published" ? "已发布" : "草稿"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(article.created_at), "yyyy年MM月dd日")}</span>
                          <span>•</span>
                          <Eye className="h-3 w-3" />
                          <span>{article.view_count} 浏览</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="qa">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">提问</h4>
                    <div className="space-y-3">
                      {memberQuestions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">暂无提问</p>
                      ) : (
                        memberQuestions.map((question) => (
                          <div key={question.id} className="p-3 border rounded-lg">
                            <h5 className="font-medium">{question.title}</h5>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(question.created_at), "yyyy年MM月dd日")}</span>
                              <span>•</span>
                              <MessageSquare className="h-3 w-3" />
                              <span>{question.answer_count || 0} 回答</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">回答</h4>
                    <div className="space-y-3">
                      {memberAnswers.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">暂无回答</p>
                      ) : (
                        memberAnswers.map((answer) => (
                          <div key={answer.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(answer.created_at), "yyyy年MM月dd日")}</span>
                              </div>
                              {answer.is_accepted && (
                                <Badge variant="default" className="bg-green-600">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  已采纳
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm line-clamp-2">{stripHtml(answer.content)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* 状态管理对话框 */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>管理会员状态</DialogTitle>
            <DialogDescription>
              修改会员 {selectedMember?.username} 的账号状态
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleToggleStatus} className="space-y-4">
            <div>
              <Label>账号状态</Label>
              <Select name="status" defaultValue={selectedMember?.status || "active"} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="disabled">禁用</SelectItem>
                  <SelectItem value="suspended">暂停</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>原因说明</Label>
              <Textarea
                name="reason"
                placeholder="请输入状态变更原因..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">确认</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑会员等级对话框 */}
      <Dialog open={levelEditDialogOpen} onOpenChange={setLevelEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑会员等级配置</DialogTitle>
            <DialogDescription>修改会员等级的名称、积分要求和权益</DialogDescription>
          </DialogHeader>
          {selectedLevel && (
            <form onSubmit={handleUpdateLevel} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">等级名称 *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedLevel.name}
                    required
                    placeholder="例如：新手会员"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="badge_color">徽章颜色 *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="badge_color"
                      name="badge_color"
                      type="color"
                      defaultValue={selectedLevel.badge_color}
                      required
                      className="w-20"
                    />
                    <Input
                      type="text"
                      defaultValue={selectedLevel.badge_color}
                      placeholder="#94a3b8"
                      className="flex-1"
                      onChange={(e) => {
                        const colorInput = document.getElementById("badge_color") as HTMLInputElement;
                        if (colorInput) colorInput.value = e.target.value;
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_points">最低积分 *</Label>
                  <Input
                    id="min_points"
                    name="min_points"
                    type="number"
                    defaultValue={selectedLevel.min_points}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_points">最高积分</Label>
                  <Input
                    id="max_points"
                    name="max_points"
                    type="number"
                    defaultValue={selectedLevel.max_points || ""}
                    min="0"
                    placeholder="留空表示无上限"
                  />
                  <p className="text-xs text-muted-foreground">留空表示无上限</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">等级描述 *</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={selectedLevel.benefits?.description || ""}
                  required
                  placeholder="例如：欢迎加入"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">会员权益 *</Label>
                <Textarea
                  id="features"
                  name="features"
                  defaultValue={selectedLevel.benefits?.features?.join("\n") || ""}
                  required
                  rows={6}
                  placeholder="每行一个权益，例如：&#10;基础浏览&#10;提问功能&#10;发布文章"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">每行输入一个权益特性</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  预览效果
                </h4>
                <div className="flex items-center gap-3 p-3 bg-background border rounded-lg">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedLevel.badge_color }}
                  />
                  <div>
                    <h5 className="font-semibold">{selectedLevel.name}</h5>
                    <p className="text-sm text-muted-foreground">
                      积分范围: {selectedLevel.min_points} - {selectedLevel.max_points || "无上限"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLevelEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">
                  <Settings className="h-4 w-4 mr-2" />
                  保存配置
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
