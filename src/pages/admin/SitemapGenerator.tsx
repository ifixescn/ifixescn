import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, FileText, CheckCircle } from "lucide-react";
import { supabase } from "@/db/supabase";

/**
 * Sitemap生成器页面
 * 
 * 功能：
 * 1. 生成XML格式的sitemap
 * 2. 包含所有公开文章、产品、问答等页面
 * 3. 自动设置优先级和更新频率
 * 4. 支持下载sitemap.xml文件
 */
export default function SitemapGenerator() {
  const [generating, setGenerating] = useState(false);
  const [sitemap, setSitemap] = useState<string>("");
  const [stats, setStats] = useState({
    articles: 0,
    products: 0,
    questions: 0,
    categories: 0
  });
  const { toast } = useToast();

  // 生成sitemap
  const generateSitemap = async () => {
    try {
      setGenerating(true);
      
      const baseUrl = window.location.origin;
      const currentDate = new Date().toISOString();
      
      // 获取所有公开文章
      const { data: articles } = await supabase
        .from("articles")
        .select("slug, updated_at, created_at")
        .eq("status", "published")
        .order("updated_at", { ascending: false });
      
      // 获取所有产品
      const { data: products } = await supabase
        .from("products")
        .select("id, updated_at, created_at")
        .order("updated_at", { ascending: false });
      
      // 获取所有问答
      const { data: questions } = await supabase
        .from("questions")
        .select("id, updated_at, created_at")
        .order("updated_at", { ascending: false });
      
      // 获取所有分类
      const { data: categories } = await supabase
        .from("categories")
        .select("id, updated_at, created_at")
        .order("updated_at", { ascending: false });
      
      // 更新统计
      setStats({
        articles: articles?.length || 0,
        products: products?.length || 0,
        questions: questions?.length || 0,
        categories: categories?.length || 0
      });
      
      // 构建sitemap XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // 首页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>1.0</priority>\n';
      xml += '  </url>\n';
      
      // 文章列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/articles</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
      
      // 产品列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/products</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.9</priority>\n';
      xml += '  </url>\n';
      
      // 问答列表页
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}/questions</loc>\n`;
      xml += `    <lastmod>${currentDate}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
      
      // 所有文章
      articles?.forEach(article => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/articles/${article.slug}</loc>\n`;
        xml += `    <lastmod>${article.updated_at || article.created_at}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });
      
      // 所有产品
      products?.forEach(product => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/products/${product.id}</loc>\n`;
        xml += `    <lastmod>${product.updated_at || product.created_at}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
      
      // 所有问答
      questions?.forEach(question => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/questions/${question.id}</loc>\n`;
        xml += `    <lastmod>${question.updated_at || question.created_at}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.6</priority>\n';
        xml += '  </url>\n';
      });
      
      // 所有分类
      categories?.forEach(category => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/articles/category/${category.id}</loc>\n`;
        xml += `    <lastmod>${category.updated_at || category.created_at}</lastmod>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });
      
      xml += '</urlset>';
      
      setSitemap(xml);
      
      toast({
        title: "Success",
        description: "Sitemap generated successfully"
      });
    } catch (error) {
      console.error("Failed to generate sitemap:", error);
      toast({
        title: "Error",
        description: "Failed to generate sitemap",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  
  // 下载sitemap
  const downloadSitemap = () => {
    if (!sitemap) return;
    
    const blob = new Blob([sitemap], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Sitemap downloaded successfully"
    });
  };
  
  // 页面加载时自动生成
  useEffect(() => {
    generateSitemap();
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sitemap Generator</h1>
        <p className="text-muted-foreground">
          Generate XML sitemap for search engine optimization
        </p>
      </div>
      
      <div className="grid gap-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Articles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.articles}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.products}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.questions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.categories}</div>
            </CardContent>
          </Card>
        </div>
        
        {/* 操作按钮 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Sitemap Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={generateSitemap}
                disabled={generating}
                className="flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate Sitemap
                  </>
                )}
              </Button>
              
              <Button
                onClick={downloadSitemap}
                disabled={!sitemap}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download sitemap.xml
              </Button>
            </div>
            
            {sitemap && (
              <div className="flex items-start gap-2 p-4 bg-muted rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Sitemap generated successfully</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Total URLs: {stats.articles + stats.products + stats.questions + stats.categories + 4}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload this file to your website root directory as <code className="bg-background px-1 py-0.5 rounded">sitemap.xml</code>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Then submit it to search engines (Google Search Console, Bing Webmaster Tools, etc.)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sitemap预览 */}
        {sitemap && (
          <Card>
            <CardHeader>
              <CardTitle>Sitemap Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-96">
                {sitemap}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
