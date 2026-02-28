import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { getCategoryById, getQuestionsByCategoryId, countQuestionsByCategory, getSiteSetting, getCategories, getPopularProducts } from "@/db/api";
import { Calendar, User, MessageCircle, ChevronLeft, FolderOpen, TrendingUp } from "lucide-react";
import type { Category, QuestionWithAnswers, ProductWithImages } from "@/types";
import { useToast } from "@/hooks/use-toast";
import PageMeta from "@/components/common/PageMeta";

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

export default function QuestionsByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [latestProducts, setLatestProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [siteName, setSiteName] = useState("");
  const { toast } = useToast();

  const itemsPerPage = 7; // 每页7条
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (!categoryId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryData, count, siteNameData, categoriesData, productsData] = await Promise.all([
          getCategoryById(categoryId),
          countQuestionsByCategory(categoryId),
          getSiteSetting("site_name"),
          getCategories("question"),
          getPopularProducts(5)
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
        setCategories(categoriesData);
        setLatestProducts(productsData);
        if (siteNameData?.value) setSiteName(siteNameData.value);

        const questionsData = await getQuestionsByCategoryId(
          categoryId,
          currentPage,
          itemsPerPage // 使用固定的7条每页
        );
        setQuestions(questionsData);
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
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Sidebar skeleton */}
          <div className="hidden xl:block xl:w-64 space-y-4 flex-shrink-0">
            <Skeleton className="h-48 w-full bg-muted" />
            <Skeleton className="h-64 w-full bg-muted" />
          </div>
          {/* Content skeleton */}
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
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
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Category not found</p>
            <Link to="/questions">
              <Button variant="outline" className="mt-4">
                BackQ&A List
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
        description={category.description || `Browse ${category.name} questions`}
        keywords={category.seo_keywords || category.name}
      />
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
        <div className="mb-8">
          <Link to="/questions">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Q&A List
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">{category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground">{category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {totalCount} Questions
          </p>
        </div>

        {questions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No questions in this category yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col xl:flex-row gap-6">
            {/* Left Sidebar - Hidden on mobile */}
            <aside className="hidden xl:block xl:w-64 space-y-6 flex-shrink-0">
              {/* Category List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Q&A Categories
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <Link to="/questions">
                    <Button variant="ghost" className="w-full justify-start">
                      All Q&A
                    </Button>
                  </Link>
                  {categories.map(cat => (
                    <Link key={cat.id} to={`/questions/category/${cat.id}`}>
                      <Button 
                        variant={cat.id === categoryId ? "secondary" : "ghost"} 
                        className="w-full justify-start"
                      >
                        {cat.name}
                      </Button>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {/* Latest Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Latest Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {latestProducts.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/products/${product.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        {product.images && product.images.length > 0 && (
                          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                            <img 
                              src={product.images[0].image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h4>
                          <span className="text-xs text-muted-foreground mt-1 block">
                            {new Date(product.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </aside>

            {/* Right Side - Questions List */}
            <div className="flex-1">
              <div className="space-y-4">
                {questions.map((question) => (
                  <Link key={question.id} to={`/questions/${question.id}`}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader className="p-3 xl:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <CardTitle className="line-clamp-2 hover:text-primary transition-colors flex-1">
                            {question.title}
                          </CardTitle>
                          <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                            <MessageCircle className="h-3 w-3" />
                            {question.answer_count || 0}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0 xl:p-6 xl:pt-0">
                        {question.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                            {stripHtml(question.content)}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {category.show_author && question.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{question.author.nickname || question.author.username}</span>
                            </div>
                          )}
                          {category.show_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(question.created_at)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                              setCurrentPage(currentPage - 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {/* 页码显示逻辑 */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // 显示第一页、最后一页、当前页及其前后各一页
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                              setCurrentPage(currentPage + 1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
