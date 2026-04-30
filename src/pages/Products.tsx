import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { getProducts, getCategories } from "@/db/api";
import type { ProductWithImages, Category } from "@/types";
import TranslatedText from "@/components/common/TranslatedText";
import { useTranslation } from "@/contexts/TranslationContext";
import { Package, FolderOpen, Sparkles, ChevronRight, Tag } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

export default function Products() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const productsPerPage = 12;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, categoriesData, allProductsData] = await Promise.all([
          getProducts(currentPage, productsPerPage, "published"),
          getCategories("product"),
          getProducts(1, 100, "published"),
        ]);
        setProducts(productsData.products);
        setTotalProducts(productsData.total);
        setCategories(categoriesData);
        const shuffled = [...allProductsData.products].sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 5));
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalProducts / productsPerPage);

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

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Products"
        description="Browse our comprehensive collection of mobile phone repair parts, tools, and accessories. Find quality replacement parts for all major smartphone brands."
        keywords="repair parts, phone parts, replacement parts, repair tools, smartphone accessories, screen replacement, battery replacement"
      />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/8 via-primary/3 to-background">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--primary)/0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16 relative">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-5">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">{t("products.title", "Product Showcase")}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-primary/20">
                <Package className="h-3.5 w-3.5" />
                {t("products.title", "Product Showcase")}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3 break-keep text-balance">
                {t("products.browseAll", "Discover Quality Repair Tools")}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {t("products.subtitle", "Professional-grade repair equipment trusted by technicians worldwide.")}
              </p>
            </div>
            {/* stat chips */}
            <div className="flex gap-4 shrink-0">
              {[
                { icon: <Package className="h-4 w-4" />, value: totalProducts, label: t("products.itemsCount", "Products") },
                { icon: <FolderOpen className="h-4 w-4" />, value: categories.length, label: t("products.categoriesCount", "Categories") },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center bg-card border rounded-xl px-5 py-3 shadow-sm min-w-[80px]">
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

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 max-w-7xl py-8 md:py-10">
        <div className="flex flex-col xl:flex-row gap-8">

          {/* ── Sidebar ── */}
          <aside className="hidden xl:flex xl:flex-col xl:w-60 gap-5 flex-shrink-0">
            {/* Categories */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <FolderOpen className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">{t("products.categories", "Product Categories")}</span>
              </div>
              <div className="p-2 space-y-0.5">
                <Link to="/products">
                  <Button variant="ghost" className="w-full justify-start text-sm h-9 rounded-lg hover:bg-primary/5 hover:text-primary">
                    {t("products.allProducts", "All Products")}
                  </Button>
                </Link>
                {categories.map((cat) => (
                  <Link key={cat.id} to={`/products/category/${cat.id}`}>
                    <Button variant="ghost" className="w-full justify-between text-sm h-9 rounded-lg hover:bg-primary/5 hover:text-primary group">
                      <TranslatedText text={cat.name} />
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recommended */}
            {recommendedProducts.length > 0 && (
              <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold">{t("products.relatedProducts", "Recommended")}</span>
                </div>
                <div className="p-3 space-y-3">
                  {recommendedProducts.map((product) => (
                    <Link key={product.id} to={`/products/${product.slug}`} className="flex items-center gap-3 group">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted border shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0].image_url} alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                        <TranslatedText text={product.name} />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── Product Grid ── */}
          <div className="flex-1 min-w-0">
            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-xl overflow-hidden">
                    <Skeleton className="bg-muted aspect-square w-full" />
                    <div className="p-3">
                      <Skeleton className="bg-muted h-4 w-4/5 mx-auto" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty */}
            {!loading && products.length === 0 && (
              <div className="text-center py-20 border rounded-xl bg-muted/20">
                <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4">
                  <Package className="h-10 w-10 text-primary" />
                </div>
                <p className="text-muted-foreground text-sm">{t("products.noProducts", "No products yet")}</p>
              </div>
            )}

            {/* Grid */}
            {!loading && products.length > 0 && (
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
                            {/* hover tint overlay */}
                            <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-200" />
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Tag className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* top-right image count badge */}
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
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
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
          </div>
        </div>
      </div>
    </div>
  );
}
