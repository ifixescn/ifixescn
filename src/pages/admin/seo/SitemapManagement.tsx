import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Download, RefreshCw, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getSitemapEntries } from "@/db/api";
import type { SitemapEntry } from "@/types";

export default function SitemapManagement() {
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await getSitemapEntries();
      setEntries(data);
    } catch (error) {
      console.error("加载站点地图条目失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载站点地图条目，请刷新页面重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSitemap = () => {
    const baseUrl = window.location.origin;
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    entries.forEach((entry) => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${entry.page_path}</loc>\n`;
      xml += `    <lastmod>${new Date(entry.updated_at).toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${entry.change_frequency}</changefreq>\n`;
      xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await loadEntries();
      toast({
        title: "生成成功",
        description: "站点地图已更新",
      });
    } catch (error) {
      console.error("生成站点地图失败:", error);
      toast({
        title: "生成失败",
        description: "无法生成站点地图，请重试",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const xml = generateSitemap();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "下载成功",
      description: "站点地图已下载到本地",
    });
  };

  const handlePreview = () => {
    const xml = generateSitemap();
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 0.8) {
      return <Badge variant="default">高</Badge>;
    } else if (priority >= 0.5) {
      return <Badge variant="secondary">中</Badge>;
    } else {
      return <Badge variant="outline">低</Badge>;
    }
  };

  const getFrequencyText = (frequency: string) => {
    const map: Record<string, string> = {
      always: "总是",
      hourly: "每小时",
      daily: "每天",
      weekly: "每周",
      monthly: "每月",
      yearly: "每年",
      never: "从不",
    };
    return map[frequency] || frequency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  return (
    <>
      <Helmet>
        <title>Sitemap Management - Admin Panel</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sitemap Management</h1>
            <p className="text-muted-foreground mt-2">
              生成和管理网站的 XML 站点地图，帮助搜索引擎更好地索引您的网站
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <FileText className="h-4 w-4 mr-2" />
              预览
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
              {generating ? "生成中..." : "重新生成"}
            </Button>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">总页面数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{entries.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">高优先级</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.priority >= 0.8).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">中优先级</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.priority >= 0.5 && e.priority < 0.8).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">低优先级</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {entries.filter(e => e.priority < 0.5).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 页面列表 */}
        <Card>
          <CardHeader>
            <CardTitle>站点地图条目</CardTitle>
            <CardDescription>
              以下页面将包含在站点地图中
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  还没有配置任何页面的 SEO 设置
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>页面路径</TableHead>
                      <TableHead>页面标题</TableHead>
                      <TableHead>优先级</TableHead>
                      <TableHead>更新频率</TableHead>
                      <TableHead>最后更新</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {entry.page_path}
                        </TableCell>
                        <TableCell>
                          {entry.page_title || (
                            <span className="text-muted-foreground">未设置</span>
                          )}
                        </TableCell>
                        <TableCell>{getPriorityBadge(entry.priority)}</TableCell>
                        <TableCell>{getFrequencyText(entry.change_frequency)}</TableCell>
                        <TableCell>{formatDate(entry.updated_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 提交到搜索引擎 */}
        <Card>
          <CardHeader>
            <CardTitle>提交到搜索引擎</CardTitle>
            <CardDescription>
              将站点地图提交到各大搜索引擎，加快索引速度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Google Search Console</h3>
                  <p className="text-sm text-muted-foreground">
                    在 Google Search Console 中提交站点地图
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    前往提交
                  </a>
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Bing Webmaster Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    在 Bing Webmaster Tools 中提交站点地图
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a
                    href="https://www.bing.com/webmasters"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    前往提交
                  </a>
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">站点地图 URL：</p>
                <code className="text-sm bg-background px-2 py-1 rounded">
                  {window.location.origin}/sitemap.xml
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
