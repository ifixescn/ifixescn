import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getArticles, getCategories } from "@/db/api";
import type { ArticleWithAuthor, Category } from "@/types";
import { ArrowRight, FileText, FolderOpen, Clock } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

export default function Articles() {
  const [articles, setArticles] = useState<ArticleWithAuthor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [latestArticles, setLatestArticles] = useState<ArticleWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      const [articlesData, categoriesData, latestData] = await Promise.all([
        getArticles(page, 12, "published"),
        getCategories("article"),
        getArticles(1, 5, "published")
      ]);
      setArticles(articlesData.articles);
      setTotal(articlesData.total);
      setCategories(categoriesData);
      setLatestArticles(latestData.articles);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load articles:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="container mx-auto">
          <div className="mb-12 text-center">
            <Skeleton className="h-12 w-64 mx-auto mb-4 bg-muted" />
            <Skeleton className="h-6 w-96 mx-auto bg-muted" />
          </div>
          <div className="flex gap-6">
            <div className="w-64 space-y-4">
              <Skeleton className="h-48 w-full bg-muted" />
              <Skeleton className="h-48 w-full bg-muted" />
            </div>
            <div className="flex-1 grid grid-cols-2 xl:grid-cols-3 gap-4 xl:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full bg-muted" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 bg-muted" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2 bg-muted" />
                    <Skeleton className="h-4 w-2/3 bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title="Articles"
        description="Explore our comprehensive collection of mobile phone repair guides, tutorials, and technical articles. Learn repair techniques, troubleshooting tips, and industry insights."
        keywords="repair guides, repair tutorials, phone repair articles, troubleshooting, repair tips, technical guides, repair techniques"
      />
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            Article List
          </h1>
          <p className="text-muted-foreground text-lg">Explore exciting content and get the latest information</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left sidebar - Hidden on mobile */}
          <aside className="hidden xl:block xl:w-64 space-y-6 flex-shrink-0">
            {/* Category list */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Article Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link to="/articles">
                  <Button variant="ghost" className="w-full justify-start">
                    All Articles
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category.id} to={`/articles/category/${category.id}`}>
                    <Button variant="ghost" className="w-full justify-start">
                      {category.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Latest articles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Latest Articles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestArticles.map(article => (
                  <Link 
                    key={article.id} 
                    to={`/articles/${article.slug}`}
                    className="block group"
                  >
                    <div className="flex gap-3">
                      {article.cover_image && (
                        <div className="aspect-square w-16 h-16 overflow-hidden rounded bg-muted flex-shrink-0">
                          <img
                            src={article.cover_image}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>

          {/* Article List */}
          <div className="flex-1">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
              {articles.map(article => (
                <Card key={article.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="p-3 xl:p-6">
                    {article.cover_image && (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        className="w-full h-32 xl:h-48 object-cover rounded-lg mb-2 xl:mb-4"
                      />
                    )}
                    <div className="flex items-center gap-1 xl:gap-2 mb-1 xl:mb-2 flex-wrap">
                      {article.category && (
                        <Link 
                          to={`/articles/category/${article.category.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs xl:text-sm px-1.5 xl:px-2.5 py-0 xl:py-0.5">
                            {article.category.name}
                          </Badge>
                        </Link>
                      )}
                      <span className="text-xs xl:text-sm text-muted-foreground">
                        {new Date(article.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-sm xl:text-lg">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-2 xl:line-clamp-3 text-xs xl:text-sm mt-1 xl:mt-2">
                      {article.excerpt || article.content.substring(0, 100)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                    <Button variant="link" className="p-0 h-auto text-xs xl:text-sm" asChild>
                      <Link to={`/articles/${article.slug}`}>
                        Read More <ArrowRight className="ml-1 xl:ml-2 h-3 w-3 xl:h-4 xl:w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={page * 12 >= total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
