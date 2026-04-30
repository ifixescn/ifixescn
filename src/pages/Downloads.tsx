import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download as DownloadIcon, FileText, Eye, Layers, Lock, ChevronRight } from "lucide-react";
import { getDownloads, getCategories } from "@/db/api";
import type { Download, Category } from "@/types";
import PageMeta from "@/components/common/PageMeta";
import TranslatedText from "@/components/common/TranslatedText";
import { useTranslation } from "@/contexts/TranslationContext";

export default function Downloads() {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => { loadData(); }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [downloadsData, categoriesData] = await Promise.all([
        getDownloads({ categoryId: selectedCategory || undefined }),
        getCategories("download"),
      ]);
      setDownloads(downloadsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Resource Downloads"
        description="Access comprehensive mobile phone repair resources including repair manuals, schematics, software tools, and technical documentation."
        keywords="repair manuals, repair downloads, schematics, repair software, technical documents, repair resources"
      />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background">
        {/* subtle grid texture */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="container mx-auto px-4 max-w-6xl py-14 md:py-20 relative">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">
              {t("downloads.title", "Resource Downloads")}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/20">
                <DownloadIcon className="h-3.5 w-3.5" />
                Technical Resources
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 break-keep text-balance">
                {t("downloads.title", "Resource Downloads")}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t("downloads.subtitle", "Professional repair manuals, firmware, diagnostic software and technical documentation for certified technicians.")}
              </p>
            </div>

            {/* stat chips */}
            <div className="flex gap-4 shrink-0">
              {[
                { icon: <Layers className="h-4 w-4" />, value: downloads.length, label: t("downloads.filesCount", "Files") },
                { icon: <FileText className="h-4 w-4" />, value: categories.length, label: t("downloads.categoriesCount", "Categories") },
              ].map((s) => (
                <div key={s.label}
                  className="flex flex-col items-center justify-center bg-card border rounded-xl px-5 py-3 shadow-sm min-w-[80px]">
                  <div className="flex items-center gap-1 text-primary mb-0.5">
                    {s.icon}
                    <span className="text-2xl font-bold tabular-nums">{s.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-6xl py-8 md:py-10">

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground mr-1 shrink-0">Filter:</span>
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              size="sm"
              className="rounded-full h-8 text-xs"
              onClick={() => setSelectedCategory("")}
            >
              {t("downloads.allCategories", "All")}
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="rounded-full h-8 text-xs"
                onClick={() => setSelectedCategory(cat.id)}
              >
                <TranslatedText text={cat.name} />
              </Button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-xl p-5 space-y-3">
                <Skeleton className="bg-muted h-4 w-20 rounded-full" />
                <Skeleton className="bg-muted h-6 w-4/5" />
                <Skeleton className="bg-muted h-4 w-full" />
                <Skeleton className="bg-muted h-4 w-3/5" />
                <Skeleton className="bg-muted h-9 w-full rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && downloads.length === 0 && (
          <div className="text-center py-20 border rounded-xl bg-muted/20">
            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
              <FileText className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("downloads.noDownloads", "No resources available yet")}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && downloads.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {downloads.map((download) => {
              const catName = categories.find((c) => c.id === download.category_id)?.name || "";
              return (
                <div
                  key={download.id}
                  className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 flex flex-col"
                >
                  {/* left accent bar */}
                  <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                  <div className="flex flex-col flex-1 p-5 pl-6">
                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {download.category_id && catName && (
                        <Link to={`/downloads/category/${download.category_id}`}>
                          <Badge variant="secondary" className="text-xs rounded-full hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer">
                            <TranslatedText text={catName} />
                          </Badge>
                        </Link>
                      )}
                      {download.require_member && (
                        <Badge className="text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200 gap-1 hover:bg-amber-100">
                          <Lock className="h-2.5 w-2.5" />
                          {t("member.profile", "Member")}
                        </Badge>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-foreground text-[0.9375rem] leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      <TranslatedText text={download.title} />
                    </h3>

                    {/* Description */}
                    {download.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                        <TranslatedText text={download.description} />
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 mt-auto mb-4 pt-3 border-t">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5 text-primary/60" />
                        {formatFileSize(download.file_size || 0)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <DownloadIcon className="h-3.5 w-3.5 text-primary/60" />
                        {download.download_count}
                      </span>
                    </div>

                    {/* CTA */}
                    <Link to={`/downloads/${download.id}`}>
                      <Button className="w-full" size="sm">
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        {t("downloads.downloadNow", "View & Download")}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


