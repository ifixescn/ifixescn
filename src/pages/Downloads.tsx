import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon, FileText, Eye } from "lucide-react";
import { getDownloads, getCategories } from "@/db/api";
import type { Download, Category } from "@/types";
import PageMeta from "@/components/common/PageMeta";

export default function Downloads() {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageMeta 
        title="Resource Downloads"
        description="Access comprehensive mobile phone repair resources including repair manuals, schematics, software tools, and technical documentation. Download essential repair resources."
        keywords="repair manuals, repair downloads, schematics, repair software, technical documents, repair resources, repair tools download"
      />
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Resource Downloads</h1>
        <p className="text-muted-foreground">
          Provides various resource downloads, some resources require member permissions
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            onClick={() => setSelectedCategory("")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Download List */}
      {downloads.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No downloads yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
          {downloads.map((download) => (
            <Card key={download.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="p-3 xl:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm xl:text-lg mb-1 xl:mb-2 line-clamp-2">{download.title}</CardTitle>
                    {download.category_id && (
                      <Link to={`/downloads/category/${download.category_id}`}>
                        <Badge variant="secondary" className="mb-1 xl:mb-2 hover:bg-secondary/80 cursor-pointer text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5">
                          {categories.find((c) => c.id === download.category_id)?.name}
                        </Badge>
                      </Link>
                    )}
                  </div>
                  {download.require_member && (
                    <Badge variant="default" className="text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5 flex-shrink-0">
                      Member
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                {download.description && (
                  <p className="text-xs xl:text-sm text-muted-foreground mb-2 xl:mb-4 line-clamp-2">
                    {download.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs xl:text-sm text-muted-foreground mb-2 xl:mb-4">
                  <div className="flex items-center gap-2 xl:gap-4">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3 xl:h-4 xl:w-4" />
                      {formatFileSize(download.file_size || 0)}
                    </span>
                    <span className="flex items-center gap-1">
                      <DownloadIcon className="h-3 w-3 xl:h-4 xl:w-4" />
                      {download.download_count}
                    </span>
                  </div>
                </div>
                <Link to={`/downloads/${download.id}`}>
                  <Button className="w-full h-8 xl:h-10 text-xs xl:text-sm">
                    <Eye className="mr-1 xl:mr-2 h-3 w-3 xl:h-4 xl:w-4" />
                    View Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
