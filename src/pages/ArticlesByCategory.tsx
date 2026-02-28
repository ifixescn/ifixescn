import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryById, getArticlesByCategoryId, countArticlesByCategory, getSiteSetting } from "@/db/api";
import { Calendar, User, ChevronLeft, ChevronRight, Home } from "lucide-react";
import type { Category, ArticleWithAuthor } from "@/types";
import { useToast } from "@/hooks/use-toast";
import PageMeta from "@/components/common/PageMeta";

export default function ArticlesByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [siteName, setSiteName] = useState("");
  const { toast } = useToast();

  const itemsPerPage = category?.items_per_page || 12;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (!categoryId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryData, count, siteNameData] = await Promise.all([
          getCategoryById(categoryId),
          countArticlesByCategory(categoryId),
          getSiteSetting("site_name")
        ]);

        if (!categoryData) {
          toast({
            title: "Error",
            description: "Category not found",
            variant: "destructive"
          });
          return;
        }

        setCategory(categoryData);
        setTotalCount(count);
        if (siteNameData?.value) setSiteName(siteNameData.value);

        const articlesData = await getArticlesByCategoryId(
          categoryId,
          currentPage,
          categoryData.items_per_page
        );
        setArticles(articlesData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({
          title: "Error",
          description: "Failed to load data, please try again later",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [categoryId, currentPage, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader className="p-3 xl:p-6">
                <Skeleton className="h-6 w-3/4 bg-muted" />
              </CardHeader>
              <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                <Skeleton className="h-4 w-full mb-2 bg-muted" />
                <Skeleton className="h-4 w-2/3 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Category not found</p>
            <Link to="/articles">
              <Button variant="outline" className="mt-4">
                Back to Article List
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta 
        title={`${category.name} - ${siteName || 'iFixes'}`}
        description={category.description || `Browse ${category.name} articles`}
        keywords={category.seo_keywords || category.name}
      />
      
      {/* 结构化数据 - 面包屑导航 */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": window.location.origin
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Articles",
                "item": `${window.location.origin}/articles`
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": category.name,
                "item": window.location.href
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": category.name,
            "description": category.description || `Browse ${category.name} articles`,
            "url": window.location.href,
            "isPartOf": {
              "@type": "WebSite",
              "name": siteName || "iFixes",
              "url": window.location.origin
            }
          })}
        </script>
      </Helmet>
      
      {category.banner_image && (
        <div className="w-full h-64 xl:h-80 overflow-hidden bg-muted">
          <img
            src={category.banner_image}
            alt={category.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground transition-colors flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/articles" className="hover:text-foreground transition-colors">
            Articles
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{category.name}</span>
        </nav>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {totalCount} articles
          </p>
        </div>

        {articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No articles in this category yet</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
              {articles.map((article) => (
                <Link key={article.id} to={`/articles/${article.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    {article.cover_image && (
                      <div className="w-full h-48 overflow-hidden rounded-t-lg">
                        <img
                          src={article.cover_image}
                          alt={article.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="p-3 xl:p-6">
                      <CardTitle className="line-clamp-2 hover:text-primary transition-colors">
                        {article.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                      {article.excerpt && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {category.show_author && article.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{article.author.nickname || article.author.username}</span>
                          </div>
                        )}
                        {category.show_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(article.created_at)}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
