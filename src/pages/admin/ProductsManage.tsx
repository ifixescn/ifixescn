import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct, toggleProductFeatured } from "@/db/api";
import type { ProductWithImages, Category, ContentStatus } from "@/types";
import { Pencil, Trash2, Plus, Eye, Star } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import MultiImageUpload from "@/components/common/MultiImageUpload";

export default function ProductsManage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithImages | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [formDescription, setFormDescription] = useState("");
  const [formContent, setFormContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(1, 100),
        getCategories("product")
      ]);
      setProducts(productsData.products);
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const priceStr = formData.get("price") as string;
    const price = priceStr ? parseFloat(priceStr) : undefined;
    const category_id = formData.get("category_id") as string;
    const status = formData.get("status") as ContentStatus;

    // Validate description is not empty
    if (!formDescription.trim()) {
      toast({ title: "Error", description: "Product Description不能为空", variant: "destructive" });
      return;
    }

    // Filter empty image URLs
    const validImages = productImages.filter(url => url && url.trim() !== "");
    
    console.log("Submitted image data:", validImages);
    console.log("ImageCount:", validImages.length);

    try {
      const productData = {
        name,
        slug,
        description: formDescription,
        content: formContent || null,
        price,
        category_id: category_id === "none" ? undefined : category_id,
        status,
        images: validImages
      };

      console.log("Complete product data:", productData);

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast({ title: "Success", description: "Products已Update" });
      } else {
        const result = await createProduct(productData);
        console.log("Create Product结果:", result);
        toast({ title: "Success", description: "Products已Create" });
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setProductImages([]);
      setFormDescription("");
      setFormContent("");
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Save failed", 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("OK要Delete这个Products吗?")) return;
    
    try {
      await deleteProduct(id);
      toast({ title: "Success", description: "Products已Delete" });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
    }
  };

  const toggleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProducts.size === 0) {
      toast({ title: "Notice", description: "请先选择要Delete的Products" });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedProducts.size} 个Products吗?`)) return;

    try {
      await Promise.all(Array.from(selectedProducts).map(id => deleteProduct(id)));
      toast({ title: "Success", description: `已删除 ${selectedProducts.size} 个Products` });
      setSelectedProducts(new Set());
      loadData();
    } catch (error) {
      console.error("批量Delete failed:", error);
      toast({ title: "Error", description: "批量Delete failed", variant: "destructive" });
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await toggleProductFeatured(id, !currentStatus);
      toast({ 
        title: "Success", 
        description: !currentStatus ? "已设为推荐Products" : "已Cancel推荐" 
      });
      loadData();
    } catch (error) {
      console.error("Update推荐StatusFailed:", error);
      toast({ title: "Error", description: "Update推荐StatusFailed", variant: "destructive" });
    }
  };

  const openEditDialog = (product: ProductWithImages) => {
    setEditingProduct(product);
    setFormDescription(product.description || "");
    setFormContent(product.content || "");
    setProductImages(product.images?.map(img => img.image_url) || []);
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormDescription("");
    setFormContent("");
    setProductImages([]);
    setDialogOpen(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || product.status === filterStatus;
    const matchesCategory = filterCategory === "all" || 
                           (filterCategory === "none" ? !product.category_id : product.category_id === filterCategory);
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Product Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              新建Products
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "新建Products"}</DialogTitle>
              <DialogDescription>
                填写Products信息,最多可Add5张Product Images
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL别名 *</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingProduct?.slug}
                  placeholder="例如: my-product"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category_id">Category</Label>
                <Select name="category_id" defaultValue={editingProduct?.category_id || "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无Category</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.price || ""}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Product Description *</Label>
                <RichTextEditor
                  value={formDescription}
                  onChange={setFormDescription}
                  placeholder="Please enterProduct Description，用于列表Page展示..."
                />
                <p className="text-xs text-muted-foreground">
                  简短介绍Products特点，将在Product ListPageShow
                </p>
              </div>
              <div className="space-y-2">
                <Label>DetailDescription</Label>
                <RichTextEditor
                  value={formContent}
                  onChange={setFormContent}
                  placeholder="Please enterProducts详细Description，支持插入Image、Videos等多媒体Content..."
                />
                <p className="text-xs text-muted-foreground">
                  详细介绍Products功能、规格、使用方法等，支持富文本Edit和ImageUpload
                </p>
              </div>
              <div className="space-y-2">
                <Label>ProductsMain Images (建议5-10张)</Label>
                <MultiImageUpload
                  value={productImages}
                  onChange={setProductImages}
                  maxImages={10}
                  maxSizeMB={1}
                />
                <p className="text-xs text-muted-foreground">
                  第一张Image将作为ProductsMain Images在列表Page展示，其他Image在DetailPage展示
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={editingProduct?.status || "draft"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter和Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="SearchName或别名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">AllStatus</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">AllCategory</SelectItem>
                  <SelectItem value="none">无Category</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statistics</Label>
              <div className="text-sm text-muted-foreground pt-2">
                共 {filteredProducts.length} 个Products
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Products列表 ({filteredProducts.length})</CardTitle>
            {selectedProducts.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">已选择 {selectedProducts.size} 个</span>
                <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                  Batch Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProducts.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedProducts.size === filteredProducts.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All</span>
              </div>
            )}
            {paginatedProducts.map(product => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={() => toggleSelectProduct(product.id)}
                />
                <div className="flex items-center gap-4 flex-1">
                  {product.images && product.images.length > 0 && (
                    <div className="aspect-square w-16 h-16 overflow-hidden rounded bg-muted flex-shrink-0">
                      <img
                        src={product.images[0].image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={
                        product.status === "published" ? "default" :
                        product.status === "draft" ? "secondary" : "outline"
                      }>
                        {product.status === "published" ? "Published" :
                         product.status === "draft" ? "Draft" : "Offline"}
                      </Badge>
                      {product.category && (
                        <Badge variant="outline">{product.category.name}</Badge>
                      )}
                      {product.price && (
                        <Badge variant="outline">¥{product.price}</Badge>
                      )}
                      {product.is_featured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          推荐
                        </Badge>
                      )}
                      {product.images && product.images.length > 0 && (
                        <Badge variant="outline">
                          📷 {product.images.length}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      浏览: {product.view_count} | 
                      创建: {new Date(product.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`featured-${product.id}`} className="text-sm cursor-pointer">
                      推荐
                    </Label>
                    <Switch
                      id={`featured-${product.id}`}
                      checked={product.is_featured}
                      onCheckedChange={() => handleToggleFeatured(product.id, product.is_featured)}
                    />
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterCategory !== "all" 
                  ? "没有Found符合条件的Products" 
                  : "No products available,点击上方按钮Create第一个Products"}
              </div>
            )}

            {/* 分页组件 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
