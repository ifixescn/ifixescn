import { Link, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  MessageCircle, 
  Users,
  Crown,
  TrendingUp,
  Settings,
  Globe,
  Download,
  Video,
  Columns,
  Type,
  Sparkles,
  MessageSquare,
  BarChart3,
  UserCog,
  Mail,
  Search,
  Rss,
  FileCode,
  ShieldCheck,
  Smartphone,
  Database
} from "lucide-react";

export default function AdminLayout() {
  const { profile } = useAuth();
  const location = useLocation();

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    return <Navigate to="/" replace />;
  }

  const menuItems = [
    { path: "/admin", icon: LayoutDashboard, label: "仪表盘", group: "概览" },
    { path: "/admin/products", icon: Package, label: "产品管理", group: "内容管理" },
    { path: "/admin/downloads", icon: Download, label: "下载管理", group: "内容管理" },
    { path: "/admin/videos", icon: Video, label: "视频管理", group: "内容管理" },
    { path: "/admin/questions", icon: MessageCircle, label: "问答管理", group: "内容管理" },
    { path: "/admin/members", icon: Crown, label: "会员管理", adminOnly: true, group: "用户管理" },
    { path: "/admin/sns-manage", icon: MessageSquare, label: "SNS管理", adminOnly: true, group: "用户管理" },
    { path: "/admin/welcome-message", icon: Mail, label: "欢迎消息设置", adminOnly: true, group: "用户管理" },
    { path: "/admin/profile-management", icon: UserCog, label: "个人主页管理", adminOnly: true, group: "用户管理" },
    { path: "/admin/search-stats", icon: TrendingUp, label: "搜索统计", group: "数据分析" },
    { path: "/admin/analytics", icon: BarChart3, label: "流量统计", adminOnly: true, group: "数据分析" },
    { path: "/admin/seo/settings", icon: Search, label: "SEO全局设置", adminOnly: true, group: "SEO管理" },
    { path: "/admin/seo/pages", icon: FileText, label: "页面SEO管理", adminOnly: true, group: "SEO管理" },
    { path: "/admin/seo/redirects", icon: TrendingUp, label: "URL重定向", adminOnly: true, group: "SEO管理" },
    { path: "/admin/seo/sitemap", icon: Globe, label: "站点地图", adminOnly: true, group: "SEO管理" },
    { path: "/admin/verification-files", icon: ShieldCheck, label: "验证文件管理", adminOnly: true, group: "SEO管理" },
    { path: "/admin/wechat-config", icon: Smartphone, label: "微信配置", adminOnly: true, group: "系统设置" },
    { path: "/admin/language-settings", icon: Globe, label: "多语言设置", adminOnly: true, group: "系统设置" },
    { path: "/admin/font-settings", icon: Type, label: "字体设置", adminOnly: true, group: "系统设置" },
    { path: "/admin/footer-settings", icon: Columns, label: "页脚设置", adminOnly: true, group: "系统设置" },
    { path: "/admin/system-settings", icon: Settings, label: "系统设置", adminOnly: true, group: "系统设置" },
    { path: "/admin/database-export", icon: Database, label: "数据库导出", adminOnly: true, group: "系统设置" },
    { path: "/admin/settings", icon: Settings, label: "站点设置", adminOnly: true, group: "系统设置" },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || profile?.role === "admin"
  );

  // 按分组组织菜单项
  const groupedMenuItems = filteredMenuItems.reduce((acc, item) => {
    const group = item.group || "其他";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof filteredMenuItems>);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <aside className="xl:col-span-1">
            <div className="bg-card rounded-lg p-4 sticky top-20">
              <h2 className="font-bold text-lg mb-4">管理菜单</h2>
              <nav className="space-y-4">
                {Object.entries(groupedMenuItems).map(([groupName, items]) => (
                  <div key={groupName}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                      {groupName}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link key={item.path} to={item.path}>
                            <Button
                              variant={isActive ? "secondary" : "ghost"}
                              className="w-full justify-start"
                            >
                              <Icon className="h-4 w-4 mr-2" />
                              {item.label}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          <main className="xl:col-span-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
