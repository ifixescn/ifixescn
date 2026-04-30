import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import PageMeta from "@/components/common/PageMeta";
import {
  Download as DownloadIcon, FileText, Calendar, AlertCircle,
  ChevronRight, ArrowLeft, HardDrive, Hash, ShieldCheck, Lock,
} from "lucide-react";
import { getDownloadById, incrementDownloadCount, getCategories, getModuleSetting } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Download, Category, ModuleSetting } from "@/types";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";

export default function DownloadDetail() {
  const { id } = useParams<{ id: string }>();
  const { t, translateText, isDefaultLang, currentLang } = useTranslation();
  const [download, setDownload] = useState<Download | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [moduleSetting, setModuleSetting] = useState<ModuleSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [translatedTitle, setTranslatedTitle] = useState<string>("");
  const [translatedDescription, setTranslatedDescription] = useState<string>("");
  const [translatedContent, setTranslatedContent] = useState<string>("");
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");

  useRecordBrowsing("download", download?.id, download?.title);

  useEffect(() => { if (id) loadData(); }, [id]);

  useEffect(() => {
    if (!download) return;
    setTranslatedTitle(download.title || "");
    setTranslatedDescription(download.description || "");
    setTranslatedContent(download.content || "");
    if (isDefaultLang) return;
    let cancelled = false;
    if (download.title) translateText(download.title).then((r) => { if (!cancelled) setTranslatedTitle(r); });
    if (download.description) translateText(download.description).then((r) => { if (!cancelled) setTranslatedDescription(r); });
    if (download.content) translateText(download.content).then((r) => { if (!cancelled) setTranslatedContent(r); });
    return () => { cancelled = true; };
  }, [download, currentLang, isDefaultLang, translateText]);

  useEffect(() => {
    if (!category) return;
    setTranslatedCategoryName(category.name);
    if (isDefaultLang) return;
    let cancelled = false;
    translateText(category.name).then((r) => { if (!cancelled) setTranslatedCategoryName(r); });
    return () => { cancelled = true; };
  }, [category, currentLang, isDefaultLang, translateText]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [downloadData, moduleSettingData] = await Promise.all([
        getDownloadById(id),
        getModuleSetting("download"),
      ]);
      setDownload(downloadData);
      setModuleSetting(moduleSettingData);
      if (downloadData?.category_id) {
        const cats = await getCategories("download");
        setCategory(cats.find((c) => c.id === downloadData.category_id) || null);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: t("detail.videoLoadFailed", "Loading failed"), description: "Failed to load download details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!download) return;
    const requireLogin = moduleSetting?.custom_settings?.require_login_to_download === true;
    if (requireLogin && !profile) {
      toast({ title: t("detail.loginRequired", "Login Required"), description: t("detail.loginBeforeDownload", "Please login before downloading"), variant: "destructive" });
      navigate("/login"); return;
    }
    if (download.require_member) {
      if (!profile) {
        toast({ title: t("detail.loginRequired", "Login Required"), description: t("detail.loginBeforeDownload", "Please login before downloading"), variant: "destructive" });
        navigate("/login"); return;
      }
      if (profile.member_level === "guest") {
        toast({ title: t("detail.memberRequired", "Member Required"), description: t("detail.upgradeToDownload", "This resource is for members only. Please upgrade your membership."), variant: "destructive" });
        return;
      }
    }
    try {
      await incrementDownloadCount(download.id);
      window.open(download.file_url, "_blank");
      toast({ title: t("detail.downloadStarted", "Download Started"), description: t("detail.downloadStartedDesc", "File download has started") });
      loadData();
    } catch (error) {
      console.error("Download failed:", error);
      toast({ title: t("detail.downloadFailed", "Download Failed"), description: t("detail.downloadFailedDesc", "Unable to download file, please try again"), variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const canDownload = !download?.require_member || (profile && profile.member_level !== "guest");

  /* Loading */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Skeleton className="bg-muted h-4 w-48 mb-6" />
            <Skeleton className="bg-muted h-10 w-3/4 mb-3" />
            <Skeleton className="bg-muted h-5 w-1/2" />
          </div>
        </div>
        <div className="container mx-auto px-4 max-w-4xl py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="bg-muted h-56 rounded-xl" />
            <div className="md:col-span-2"><Skeleton className="bg-muted h-56 rounded-xl" /></div>
          </div>
        </div>
      </div>
    );
  }

  /* Not found */
  if (!download) {
    return (
      <div className="min-h-screen bg-background container mx-auto px-4 max-w-4xl py-16">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("detail.downloadNotFound", "Download resource not found")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={download.title}
        description={download.description || `Download ${download.title} - iFixes repair resource`}
        keywords={`download, ${download.title}, repair tool, iFixes`}
        type="website"
      />

      {/* Hero */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="container mx-auto px-4 max-w-4xl py-12 md:py-16 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/downloads" className="hover:text-primary transition-colors">
              {t("downloads.title", "Downloads")}
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-xs">{download.title}</span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {category && (
              <Link to={`/downloads/category/${category.id}`}>
                <Badge variant="secondary" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                  <TranslatedText text={translatedCategoryName || category.name} />
                </Badge>
              </Link>
            )}
            {download.require_member && (
              <Badge className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 gap-1">
                <Lock className="h-2.5 w-2.5" />
                {t("detail.membersOnly", "Members Only")}
              </Badge>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3 break-keep">
            {translatedTitle || download.title}
          </h1>
          {translatedDescription && (
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
              {translatedDescription}
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="container mx-auto px-4 max-w-4xl py-8 md:py-10">
        <Link to="/downloads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("cat.backToDownloadList", "Back to Downloads")}
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Sidebar */}
          <div className="md:col-span-1 space-y-4">
            {/* File specs */}
            <Card className="shadow-sm border-l-4 border-l-primary">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  File Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {[
                  { icon: <FileText className="h-3.5 w-3.5 text-primary" />, label: "Filename", value: download.file_name || "—" },
                  { icon: <HardDrive className="h-3.5 w-3.5 text-primary" />, label: "File Size", value: formatFileSize(download.file_size || 0) },
                  { icon: <Hash className="h-3.5 w-3.5 text-primary" />, label: "Downloads", value: String(download.download_count) },
                  { icon: <Calendar className="h-3.5 w-3.5 text-primary" />, label: "Published", value: formatDate(download.created_at) },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3 py-2.5 border-b last:border-0">
                    <div className="mt-0.5 shrink-0">{row.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground mb-0.5">{row.label}</div>
                      <div className="text-sm font-medium text-foreground truncate">{row.value}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Download action */}
            <Card className="shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
              <CardContent className="pt-5">
                {download.require_member && !canDownload ? (
                  <>
                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-semibold">Member Required</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                      {t("detail.memberPermission", "This resource requires member permission to download.")}
                    </p>
                    {!profile ? (
                      <Button asChild className="w-full">
                        <Link to="/login"><DownloadIcon className="mr-2 h-4 w-4" />{t("auth.login", "Login to Download")}</Link>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to="/profile">{t("detail.upgradeToMember", "Upgrade to Member")}</Link>
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-xs font-medium">
                        {canDownload ? "Ready to Download" : "Access Restricted"}
                      </span>
                    </div>
                    <Button size="lg" className="w-full" onClick={handleDownload} disabled={!canDownload}>
                      <DownloadIcon className="mr-2 h-5 w-5" />
                      {canDownload ? t("detail.downloadNow", "Download Now") : t("detail.memberRequired", "Member Required")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="md:col-span-2">
            {download.content ? (
              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    Resource Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="rich-content"
                    dangerouslySetInnerHTML={{ __html: translatedContent || download.content }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="py-16 text-center">
                  <div className="inline-flex p-4 bg-muted rounded-2xl mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No additional details available for this resource.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
