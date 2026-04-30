import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/contexts/AuthContext";
import { getSiteSetting, getAllModuleSettings, getCategories, getUnreadNotificationCount } from "@/db/api";
import { Menu, X, LogOut, Search, ChevronDown, UserCircle, FileText, MessageSquare, LayoutDashboard, Bell, Users } from "lucide-react";
import routes from "../../routes";
import type { ModuleSetting, Category } from "@/types";
import { cn } from "@/lib/utils";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [siteName, setSiteName] = useState("iFixes");
  const [siteLogo, setSiteLogo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleSettings, setModuleSettings] = useState<Record<string, ModuleSetting>>({});
  const [articleCategories, setArticleCategories] = useState<Category[]>([]);
  const [productCategories, setProductCategories] = useState<Category[]>([]);
  const [downloadCategories, setDownloadCategories] = useState<Category[]>([]);
  const [videoCategories, setVideoCategories] = useState<Category[]>([]);
  const [questionCategories, setQuestionCategories] = useState<Category[]>([]);
  const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { t } = useTranslation();
  const navigation = routes.filter((route) => {
    if (route.visible === false) return false;
    // 文章模块关闭时，从导航栏隐藏文章入口
    if (route.path === "/articles" && moduleSettings.articles?.is_enabled === false) return false;
    return true;
  });

  // Function to load data
  const loadData = async () => {
    try {
      const setting = await getSiteSetting("site_name");
      if (setting?.value) setSiteName(setting.value);
    } catch (error) {
      console.error("Failed to load site name:", error);
    }

    try {
      const logoSetting = await getSiteSetting("site_logo");
      if (logoSetting?.value) setSiteLogo(logoSetting.value);
    } catch (error) {
      console.error("Failed to load site logo:", error);
    }

    try {
      const settings = await getAllModuleSettings();
      const settingsMap: Record<string, ModuleSetting> = {};
      settings.forEach(setting => {
        settingsMap[setting.module_type] = setting;
      });
      setModuleSettings(settingsMap);
    } catch (error) {
      console.error("Failed to load module settings:", error);
    }

    try {
      const [articles, products, downloads, videos, questions] = await Promise.all([
        getCategories("article"),
        getCategories("product"),
        getCategories("download"),
        getCategories("video"),
        getCategories("question")
      ]);
      setArticleCategories(articles);
      setProductCategories(products);
      setDownloadCategories(downloads);
      setVideoCategories(videos);
      setQuestionCategories(questions);
    } catch (error) {
      console.error("Failed to load category data:", error);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to custom events，whenCategoryUpdatereload
    const handleCategoriesUpdate = () => {
      loadData();
    };

    window.addEventListener("categoriesUpdated", handleCategoriesUpdate);
    window.addEventListener("settingsUpdated", handleCategoriesUpdate);

    return () => {
      window.removeEventListener("categoriesUpdated", handleCategoriesUpdate);
      window.removeEventListener("settingsUpdated", handleCategoriesUpdate);
    };
  }, []);

  // 加载未读通知数
  useEffect(() => {
    if (user) {
      const loadUnreadCount = async () => {
        try {
          const count = await getUnreadNotificationCount(user.id);
          setUnreadCount(count);
        } catch (error) {
          console.error("Failed to load unread notification count:", error);
        }
      };

      loadUnreadCount();
      
      // 每30秒刷新一次
      const interval = setInterval(loadUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsMenuOpen(false);
    }
  };

  const getDisplayName = (routePath: string, defaultName: string) => {
    if (routePath === "/articles" && moduleSettings.articles) {
      return moduleSettings.articles.display_name;
    }
    if (routePath === "/products" && moduleSettings.products) {
      return moduleSettings.products.display_name;
    }
    if (routePath === "/downloads" && moduleSettings.download) {
      return moduleSettings.download.display_name;
    }
    if (routePath === "/videos" && moduleSettings.video) {
      return moduleSettings.video.display_name;
    }
    if (routePath === "/questions" && moduleSettings.questions) {
      return moduleSettings.questions.display_name;
    }
    return defaultName;
  };

  const getCategoriesForPath = (path: string) => {
    if (path === "/articles") return articleCategories;
    if (path === "/products") return productCategories;
    if (path === "/downloads") return downloadCategories;
    if (path === "/videos") return videoCategories;
    if (path === "/questions") return questionCategories;
    return [];
  };

  const getCategoryPath = (modulePath: string, categoryId: string) => {
    return `${modulePath}/category/${categoryId}`;
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
      <nav className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3">
              {siteLogo ? (
                <img 
                  src={siteLogo} 
                  alt={siteName} 
                  className="h-10 w-auto max-w-[200px] object-contain transition-all duration-300 dark:brightness-0 dark:invert"
                />
              ) : (
                <>
                  <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center transition-colors duration-300">
                    <span className="text-primary-foreground font-bold text-xl">C</span>
                  </div>
                  <span className="text-xl font-bold text-foreground transition-colors duration-300">{siteName}</span>
                </>
              )}
            </Link>

            {/* PCnavigation menu */}
            <NavigationMenu className="hidden xl:flex">
              <NavigationMenuList>
                {navigation.map((item) => {
                  const categories = getCategoriesForPath(item.path);
                  const hasCategories = categories.length > 0;

                  if (hasCategories) {
                    return (
                      <NavigationMenuItem key={item.path}>
                        <NavigationMenuTrigger
                          className="font-medium"
                        >
                          <TranslatedText text={getDisplayName(item.path, item.name)} />
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <div className="w-[500px] p-6">
                            <div className="mb-4">
                              <Link
                                to={item.path}
                                className="block px-4 py-3 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
                              >
                                <div className="font-semibold text-base group-hover:text-primary transition-colors">
                                  {t("nav.all", "All")} <TranslatedText text={getDisplayName(item.path, item.name)} />
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">{t("nav.viewAllContent", "View all content")}</div>
                              </Link>
                            </div>
                            {categories.length > 0 && (
                              <>
                                <div className="border-t border-border pt-4">
                                  <div className="text-xs font-semibold text-muted-foreground px-4 mb-3 uppercase tracking-wider">
                                    {t("nav.browseByCategory", "Browse by Category")}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    {categories.map((category) => (
                                      <Link
                                        key={category.id}
                                        to={getCategoryPath(item.path, category.id)}
                                        className="block px-4 py-3 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
                                      >
                                        <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                          <TranslatedText text={category.name} />
                                        </div>
                                        {category.description && (
                                          <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                            <TranslatedText text={category.description} />
                                          </div>
                                        )}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={item.path}>
                      <Link to={item.path}>
                        <NavigationMenuLink
                          className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                        >
                          <TranslatedText text={getDisplayName(item.path, item.name)} />
                        </NavigationMenuLink>
                      </Link>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden xl:flex items-center gap-3 flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("header.searchPlaceholder", "Search articles, products, Q&A...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </form>
          </div>

          <div className="hidden xl:flex items-center gap-2">
            {/* 主题切换按钮 */}
            <ThemeToggle />
            {/* 语言切换器 */}
            <LanguageSwitcher variant="header" />
            
            {user ? (
              <>
                {/* 通知图标 */}
                <Link to="/member-center?tab=notifications" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                <NavigationMenu>
                  <NavigationMenuList>
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="font-medium gap-2">
                        <UserCircle className="h-4 w-4" />
                        {profile?.username || t("nav.memberCenter", "Member Center")}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[300px] p-6">
                          {/* User info */}
                          <div className="mb-4 pb-4 border-b border-border">
                            <div className="font-semibold text-base">{profile?.username}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {profile?.email || t("nav.memberAccount", "Member Account")}
                            </div>
                          </div>
                          
                          {/* Menu items */}
                          <div className="space-y-2">
                            <Link
                              to="/member-center"
                              className="flex items-center px-4 py-3 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
                            >
                              <UserCircle className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                {t("nav.memberCenter", "Member Center")}
                              </div>
                            </Link>
                            
                            <Link
                              to="/member-center?tab=questions"
                              className="flex items-center px-4 py-3 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
                            >
                              <MessageSquare className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                My Q&A
                              </div>
                            </Link>
                            
                            {profile?.role === "admin" && (
                              <>
                                <div className="border-t border-border my-2" />
                                <Link
                                  to="/admin"
                                  className="flex items-center px-4 py-3 rounded-lg hover:bg-secondary/80 transition-all duration-200 group"
                                >
                                  <LayoutDashboard className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                  <div className="font-medium text-sm group-hover:text-primary transition-colors">
                                    {t("nav.admin", "Admin Panel")}
                                  </div>
                                </Link>
                              </>
                            )}
                            
                            <div className="border-t border-border my-2" />
                            <button
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-3 rounded-lg hover:bg-destructive/10 transition-all duration-200 group"
                            >
                              <LogOut className="mr-3 h-4 w-4 text-destructive" />
                              <div className="font-medium text-sm text-destructive">
                                {t("nav.logout", "Logout")}
                              </div>
                            </button>
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </>
            ) : (
              <Link to="/login">
                <Button size="sm">{t("nav.login", "Login")}</Button>
              </Link>
            )}
          </div>

          <button
            className="xl:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="xl:hidden py-4 space-y-2">
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("header.searchPlaceholder", "Search articles, products, Q&A...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </form>
            {navigation.map((item) => {
              const categories = getCategoriesForPath(item.path);
              const hasCategories = categories.length > 0;
              const isOpen = openMobileMenu === item.path;

              if (hasCategories) {
                return (
                  <div key={item.path} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={item.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex-1"
                      >
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          <TranslatedText text={getDisplayName(item.path, item.name)} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenMobileMenu(isOpen ? null : item.path)}
                        className="px-2"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </Button>
                    </div>
                    {isOpen && (
                      <div className="pl-4 space-y-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={getCategoryPath(item.path, category.id)}
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-sm"
                            >
                              <TranslatedText text={category.name} />
                            </Button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    <TranslatedText text={getDisplayName(item.path, item.name)} />
                  </Button>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border space-y-2">
              {/* 主题切换按钮 - 移动端 */}
              <div className="px-2 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("member.themeMode", "Theme Mode")}</span>
                  <ThemeToggle />
                </div>
              </div>

              {/* 语言切换 - 移动端 */}
              <div className="px-2 py-2 border-t">
                <LanguageSwitcher variant="mobile" />
              </div>

              {user ? (
                <>
                  <Link to="/member-center" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <UserCircle className="h-4 w-4 mr-2" />
                      {profile?.username || t("nav.memberCenter", "Member Center")}
                    </Button>
                  </Link>
                  {profile?.role === "admin" && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        {t("nav.admin", "Admin Panel")}
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav.logout", "Logout")}
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">{t("nav.login", "Login")}</Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
