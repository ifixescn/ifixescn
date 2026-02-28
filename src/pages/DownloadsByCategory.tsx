import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDownloadsByCategory, getCategoryById, getSiteSetting } from "@/db/api";
import type { Download, Category } from "@/types";
import { Download as DownloadIcon, Calendar, ArrowLeft } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

export default function DownloadsByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (categoryId) {
      loadData();
    }
  }, [categoryId]);

  async function loadData() {
    try {
      setLoading(true);
      const [downloadsData, categoryData, siteNameData] = await Promise.all([
        getDownloadsByCategory(categoryId!),
        getCategoryById(categoryId!),
        getSiteSetting("site_name")
      ]);
      setDownloads(downloadsData);
      setCategory(categoryData);
      if (siteNameData?.value) setSiteName(siteNameData.value);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title={`${category?.name || 'Downloads'} - ${siteName || 'iFixes'}`}
        description={category?.description || `Browse ${category?.name || 'downloads'}`}
        keywords={category?.seo_keywords || category?.name || 'downloads'}
      />
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/downloads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Download List
            </Link>
          </Button>
          
          <div className="flex items-center gap-4 mb-4">
            <DownloadIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">
                {category?.name || "Category Downloads"}
              </h1>
              {category?.description && (
                <p className="text-muted-foreground mt-2">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{downloads.length} downloads</span>
          </div>
        </div>

        {downloads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DownloadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No downloads in this category yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {downloads.map((download) => (
              <Card key={download.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="p-3 xl:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="line-clamp-2 flex-1">
                      <Link
                        to={`/downloads/${download.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {download.title}
                      </Link>
                    </CardTitle>
                    {download.file_size && (
                      <Badge variant="secondary">
                        {formatFileSize(download.file_size)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {download.description && (
                    <p className="text-muted-foreground line-clamp-2">
                      {download.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(download.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <Button size="sm" asChild>
                      <Link to={`/downloads/${download.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
