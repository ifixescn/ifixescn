import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getProducts, getCategories } from "@/db/api";
import type { ProductWithImages, Category } from "@/types";
import { Package, FolderOpen, Sparkles } from "lucide-react";
import PageMeta from "@/components/common/PageMeta";

export default function Products() {
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
          getProducts(1, 100, "published") // 获取更多产品用于随机推荐
        ]);
        
        setProducts(productsData.products);
        setTotalProducts(productsData.total);
        setCategories(categoriesData);
        
        // 随机推荐5个产品
        const shuffled = [...allProductsData.products].sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 5));
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data:", error);
        setLoading(false);
      }
    };

    loadData();
  }, [currentPage]);

  // 计算总页数
  const totalPages = Math.ceil(totalProducts / productsPerPage);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <PageMeta 
        title="Products"
        description="Browse our comprehensive collection of mobile phone repair parts, tools, and accessories. Find quality replacement parts for all major smartphone brands."
        keywords="repair parts, phone parts, replacement parts, repair tools, smartphone accessories, screen replacement, battery replacement"
      />
      <div className="container mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4 flex items-center justify-center gap-3">
            <Package className="h-10 w-10 text-primary" />
            Product Showcase
          </h1>
          <p className="text-muted-foreground text-lg">Discover quality products to meet your needs</p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden xl:block xl:w-64 space-y-6 flex-shrink-0">
            {/* Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-5 w-5" />
                  Product Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Link to="/products">
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    All Products
                  </Button>
                </Link>
                {categories.map(category => (
                  <Link key={category.id} to={`/products/category/${category.id}`}>
                    <Button variant="ghost" className="w-full justify-start text-sm">
                      {category.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Recommended Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  Recommended
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendedProducts.map(product => (
                  <Link 
                    key={product.id} 
                    to={`/products/${product.slug}`}
                    className="block group"
                  >
                    <div className="space-y-2">
                      {product.images && product.images.length > 0 && (
                        <div className="aspect-square w-full overflow-hidden rounded bg-muted">
                          <img
                            src={product.images[0].image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors text-center">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {recommendedProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No products yet
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Product List */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 xl:gap-6">
              {products.map(product => (
                <Link key={product.id} to={`/products/${product.slug}`}>
                  <Card className="group hover:shadow-lg transition-shadow h-full">
                    {product.images && product.images.length > 0 && (
                      <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={product.images[0].image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardHeader className="p-2 xl:p-4">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors text-xs xl:text-base text-center">
                        {product.name}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
            
            {products.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No products yet</p>
                </CardContent>
              </Card>
            )}

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
          </div>
        </div>
      </div>
    </div>
  );
}
