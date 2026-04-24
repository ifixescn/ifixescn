import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getCategoryById, getProductsByCategoryId, countProductsByCategory, getSiteSetting } from "@/db/api";
import { ChevronLeft, Tag, Home, ChevronRight } from "lucide-react";
import type { Category, ProductWithImages } from "@/types";
import { useToast } from "@/hooks/use-toast";
import PageMeta from "@/components/common/PageMeta";
import { useTranslation } from "@/contexts/TranslationContext";
import TranslatedText from "@/components/common/TranslatedText";

export default function ProductsByCategory() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t, translateText, isDefaultLang, currentLang } = useTranslation();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [siteName, setSiteName] = useState("");
  const { toast } = useToast();

  // 翻译后的分类名称和描述
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const [translatedCategoryDesc, setTranslatedCategoryDesc] = useState<string>("");

  const itemsPerPage = 12; // 固定每页12个产品
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (!categoryId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryData, count, siteNameData] = await Promise.all([
          getCategoryById(categoryId),
          countProductsByCategory(categoryId),
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

        const productsData = await getProductsByCategoryId(
          categoryId,
          currentPage,
          itemsPerPage
        );
        setProducts(productsData);
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

  // 当语言或分类切换时，同步翻译分类名称和描述
  useEffect(() => {
    if (!category) return;
    setTranslatedCategoryName(category.name);
    setTranslatedCategoryDesc(category.description || "");
    if (isDefaultLang) return;
    let cancelled = false;
    translateText(category.name).then((r) => { if (!cancelled) setTranslatedCategoryName(r); });
    if (category.description) {
      translateText(category.description).then((r) => { if (!cancelled) setTranslatedCategoryDesc(r); });
    }
    return () => { cancelled = true; };
  }, [category, currentLang, isDefaultLang, translateText]);

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大可见页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 总是显示第一页
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      // 总是显示最后一页
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-8 bg-muted" />
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-square w-full bg-muted" />
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
            <p className="text-muted-foreground">{t("cat.categoryNotFound", "Category not found")}</p>
            <Link to="/products">
              <Button variant="outline" className="mt-4">
                {t("cat.backToProductList", "Back to Product List")}
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
        title={`${translatedCategoryName || category.name} - ${siteName || 'iFixes'}`}
        description={translatedCategoryDesc || category.description || `Browse ${category.name} products`}
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
                "name": "Products",
                "item": `${window.location.origin}/products`
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
            "description": category.description || `Browse ${category.name} products`,
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
          <Link to="/products" className="hover:text-foreground transition-colors">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{translatedCategoryName || category.name}</span>
        </nav>
        
        <div className="mb-8">
          <Link to="/products">
            <Button variant="ghost" size="sm" className="mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t("cat.backToProductList", "Back to Product List")}
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-4">{translatedCategoryName || category.name}</h1>
          {category.description && (
            <p className="text-lg text-muted-foreground">{translatedCategoryDesc || category.description}</p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {totalCount} {t("cat.productsCount", "products")}
          </p>
        </div>

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">{t("cat.noProducts", "No products in this category yet")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.slug}`}>
                  <Card className="group h-full hover:shadow-lg transition-shadow">
                    {product.images && product.images.length > 0 ? (
                      <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-muted rounded-t-lg flex items-center justify-center">
                        <Tag className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <CardHeader className="p-2 xl:p-4">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-xs xl:text-base text-center">
                        <TranslatedText text={product.name} />
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {generatePageNumbers().map((page, index) => (
                      <PaginationItem key={`page-${index}`}>
                        {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            onClick={() => handlePageChange(page as number)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
