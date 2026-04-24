import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageMeta from "@/components/common/PageMeta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download as DownloadIcon, FileText, Calendar, User, AlertCircle } from "lucide-react";
import { getDownloadById, incrementDownloadCount, getCategories, getModuleSetting } from "@/db/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Download, Category, ModuleSetting } from "@/types";
import { useRecordBrowsing } from "@/hooks/useRecordBrowsing";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";

export default function DownloadDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [download, setDownload] = useState<Download | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [moduleSetting, setModuleSetting] = useState<ModuleSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Record browsing history
  useRecordBrowsing("download", download?.id, download?.title);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [downloadData, moduleSettingData] = await Promise.all([
        getDownloadById(id),
        getModuleSetting("download")
      ]);
      
      setDownload(downloadData);
      setModuleSetting(moduleSettingData);

      if (downloadData?.category_id) {
        const categories = await getCategories("download");
        const cat = categories.find((c) => c.id === downloadData.category_id);
        setCategory(cat || null);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: t("detail.videoLoadFailed", "Loading failed"),
        description: "Failed to load download details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!download) return;

    // Check module permission settings: whether login required to download
    const requireLogin = moduleSetting?.custom_settings?.require_login_to_download === true;
    if (requireLogin && !profile) {
      toast({
        title: t("detail.loginRequired", "Login Required"),
        description: t("detail.loginBeforeDownload", "Please login before downloading"),
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    // Check member permission
    if (download.require_member) {
      if (!profile) {
        toast({
          title: t("detail.loginRequired", "Login Required"),
          description: t("detail.loginBeforeDownload", "Please login before downloading"),
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      if (profile.member_level === "guest") {
        toast({
          title: t("detail.memberRequired", "Member Required"),
          description: t("detail.upgradeToDownload", "This resource is for members only. Please upgrade your membership."),
          variant: "destructive",
        });
        return;
      }
    }

    try {
      // Increment download count
      await incrementDownloadCount(download.id);

      // Trigger download
      window.open(download.file_url, "_blank");

      toast({
        title: t("detail.downloadStarted", "Download Started"),
        description: t("detail.downloadStartedDesc", "File download has started"),
      });

      // Refresh data to update download count
      loadData();
    } catch (error) {
      console.error("Download failed:", error);
      toast({
        title: t("detail.downloadFailed", "Download Failed"),
        description: t("detail.downloadFailedDesc", "Unable to download file, please try again"),
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!download) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("detail.downloadNotFound", "Download resource not found")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const canDownload = !download.require_member || (profile && profile.member_level !== "guest");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <PageMeta
          title={download.title}
          description={download.description || `Download ${download.title} - iFixes repair resource`}
          keywords={`download, ${download.title}, repair tool, iFixes`}
          type="website"
        />
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-4">{download.title}</CardTitle>
                <div className="flex flex-wrap gap-2 mb-4">
                  {category && (
                    <Badge variant="secondary">{category.name}</Badge>
                  )}
                  {download.require_member && (
                    <Badge variant="default">{t("detail.membersOnly", "Members Only")}</Badge>
                  )}
                </div>
              </div>
            </div>

            {download.description && (
              <p className="text-muted-foreground mb-4">{download.description}</p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{download.file_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{formatFileSize(download.file_size || 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <DownloadIcon className="h-4 w-4" />
                <span>{download.download_count} {t("detail.downloads", "downloads")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(download.created_at)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* Permission Notice */}
            {download.require_member && !canDownload && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("detail.memberPermission", "This resource requires member permission to download.")}
                  {!profile ? (
                    <>
                      {" "}{t("detail.loginOrRegister", "Please login or register a member account.")}{" "}
                      <Link to="/login" className="text-primary underline mx-1">
                        {t("auth.login", "login")}
                      </Link>
                    </>
                  ) : (
                    <>
                      {" "}{t("detail.loginOrRegister", "Please")}{" "}
                      <Link to="/profile" className="text-primary underline mx-1">
                        {t("detail.upgradeToMember", "upgrade to member")}
                      </Link>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Detailed Content */}
            {download.content && (
              <div
                className="rich-content mb-6"
                dangerouslySetInnerHTML={{ __html: download.content }}
              />
            )}

            {/* Download Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleDownload}
                disabled={!canDownload}
                className="min-w-[200px]"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                {canDownload ? t("detail.downloadNow", "Download Now") : t("detail.memberRequired", "Member Required")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
