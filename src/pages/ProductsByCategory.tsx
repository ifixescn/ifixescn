import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { getCategoryById, getProductsByCategoryId, countProductsByCategory, getSiteSetting } from "@/db/api";
import { ArrowLeft, Tag, Home, ChevronRight, Package, Layers } from "lucide-react";
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
  const [translatedCategoryName, setTranslatedCategoryName] = useState<string>("");
  const [translatedCategoryDesc, setTranslatedCategoryDesc] = useState<string>("");

  const itemsPerPage = 12;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    if (!categoryId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoryData, count, siteNameData] = await Promise.all([
          getCategoryById(categoryId),
          countProductsByCategory(categoryId),
          getSiteSetting("site_name"),
        ]);
        if (!categoryData) {
          toast({ title: "Error", description: "Category not found", variant: "destructive" });
          return;
        }
        setCategory(categoryData);
        setTotalCount(count);
        if (siteNameData?.value) setSiteName(siteNameData.value);
        const productsData = await getProductsByCategoryId(categoryId, currentPage, itemsPerPage);
        setProducts(productsData);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast({ title: "Error", description: "Failed to load data, please try again later", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [categoryId, currentPage, toast]);

  useEffect(() => {
    if (!category) return;
    setTranslatedCategoryName(category.name);
    setTranslatedCategoryDesc(category.description || "");
    if (isDefaultLang) return;
    let cancelled = false;
    translateText(category.name).then((r) => { if (!cancelled) setTranslatedCategoryName(r); });
    if (category.description) translateText(category.description).then((r) => { if (!cancelled) setTranslatedCategoryDesc(r); });
    return () => { cancelled = true; };
  }, [category, currentLang, isDefaultLang, translateText]);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis-start");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis-end");
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const catDisplayName = translatedCategoryName || category?.name || "";

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background py-12">
          <div className="container mx-auto px-4 max-w-7xl">
            <Skeleton className="bg-muted h-4 w-48 mb-5" />
            <Skeleton className="bg-muted h-10 w-64 mb-3" />
            <Skeleton className="bg-muted h-4 w-80" />
          </div>
        </div>
        <div className="container mx-auto px-4 max-w-7xl py-8">
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border rounded-xl overflow-hidden">
                <Skeleton className="bg-muted aspect-square w-full" />
                <div className="p-3"><Skeleton className="bg-muted h-4 w-4/5 mx-auto" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* Not found */
  if (!category) {
    return (
      <div className="min-h-screen bg-background container mx-auto px-4 py-16 max-w-md text-center">
        <div className="inline-flex p-4 bg-muted rounded-2xl mb-4">
          <Package className="h-10 w-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-4">{t("cat.categoryNotFound", "Category not found")}</p>
        <Button asChild variant="outline">
          <Link to="/products"><ArrowLeft className="mr-2 h-4 w-4" />{t("cat.backToProductList", "Back to Product List")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${catDisplayName} - ${siteName || "iFixes"}`}
        description={translatedCategoryDesc || category.description || `Browse ${category.name} products`}
        keywords={category.seo_keywords || category.name}
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
              { "@type": "ListItem", "position": 2, "name": "Products", "item": `${window.location.origin}/products` },
              { "@type": "ListItem", "position": 3, "name": category.name, "item": window.location.href },
            ],
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org", "@type": "CollectionPage",
            "name": category.name,
            "description": category.description || `Browse ${category.name} products`,
            "url": window.location.href,
            "isPartOf": { "@type": "WebSite", "name": siteName || "iFixes", "url": window.location.origin },
          })}
        </script>
      </Helmet>

      {/* ── Hero ─────────────────────────────────────────────── */}
      {category.banner_image ? (
        /* Use banner image as hero if available */
        <div className="relative w-full h-56 md:h-72 overflow-hidden">
          <img src={category.banner_image} alt={category.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 container mx-auto px-4 max-w-7xl pb-8">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" /> Home
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-foreground font-medium">{catDisplayName}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground break-keep">{catDisplayName}</h1>
          </div>
        </div>
      ) : (
        /* Default gradient hero */
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.18) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16 relative">
            {/* breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5 flex-wrap">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home className="h-3.5 w-3.5" /> Home
              </Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-foreground font-medium">{catDisplayName}</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/20">
                  <Tag className="h-3.5 w-3.5" />
                  Category
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 break-keep text-balance">
                  {catDisplayName}
                </h1>
                {(translatedCategoryDesc || category.description) && (
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                    {translatedCategoryDesc || category.description}
                  </p>
                )}
              </div>
              <div className="flex gap-4 shrink-0">
                <div className="flex flex-col items-center justify-center bg-card border rounded-xl px-5 py-3 shadow-sm min-w-[80px]">
                  <div className="flex items-center gap-1 text-primary mb-0.5">
                    <Layers className="h-4 w-4" />
                    <span className="text-2xl font-bold tabular-nums">{totalCount}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{t("cat.productsCount", "Products")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-10">
        <Link to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("cat.backToProductList", "Back to Product List")}
        </Link>

        {/* Empty */}
        {products.length === 0 && (
          <div className="text-center py-20 border rounded-xl bg-muted/20">
            <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
              <Package className="h-10 w-10 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{t("cat.noProducts", "No products in this category yet")}</p>
          </div>
        )}

        {/* Grid */}
        {products.length > 0 && (
          <>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link key={product.id} to={`/products/${product.slug}`}>
                  <div className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/30 transition-all duration-200 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      {product.images && product.images.length > 0 ? (
                        <>
                          <img
                            src={product.images[0].image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-200" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {product.images && product.images.length > 1 && (
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-full border opacity-0 group-hover:opacity-100 transition-opacity">
                          +{product.images.length - 1}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="p-3 flex-1 flex items-center justify-center">
                      <p className="text-xs xl:text-sm font-medium text-center text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        <TranslatedText text={product.name} />
                      </p>
                    </div>

                    {/* bottom accent line */}
                    <div className="h-0.5 bg-gradient-to-r from-primary/0 via-primary/60 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {generatePageNumbers().map((page, idx) => (
                      <PaginationItem key={`page-${idx}`}>
                        {page === "ellipsis-start" || page === "ellipsis-end" ? (
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
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
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
