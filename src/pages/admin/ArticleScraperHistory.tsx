import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ScraperHistory {
  id: string;
  rule_id: string;
  source_url: string;
  article_id: string | null;
  status: 'success' | 'failed' | 'processing';
  error_message: string | null;
  images_downloaded: number;
  created_at: string;
  completed_at: string | null;
  scraper_rules: {
    name: string;
    source_name: string;
  };
  articles: {
    title: string;
    slug: string;
  } | null;
}

export default function ArticleScraperHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [history, setHistory] = useState<ScraperHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => {
    loadHistory();
  }, [filter]);

  const loadHistory = async () => {
    try {
      let query = supabase
        .from('scraper_history')
        .select(`
          *,
          scraper_rules (name, source_name),
          articles (title, slug)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: { icon: CheckCircle, variant: 'default' as const, label: '成功', color: 'text-green-600' },
      failed: { icon: XCircle, variant: 'destructive' as const, label: '失败', color: 'text-red-600' },
      processing: { icon: Clock, variant: 'secondary' as const, label: '处理中', color: 'text-blue-600' }
    };
    const { icon: Icon, variant, label, color } = config[status as keyof typeof config] || config.processing;
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className={`w-3 h-3 ${color}`} />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/article-scraper')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">采集历史</h1>
            <p className="text-muted-foreground mt-2">
              查看所有文章采集记录
            </p>
          </div>
        </div>

        {/* 筛选按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            全部
          </Button>
          <Button
            variant={filter === 'success' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('success')}
          >
            成功
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('failed')}
          >
            失败
          </Button>
        </div>
      </div>

      {/* 历史记录表格 */}
      <Card>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无采集记录</h3>
              <p className="text-muted-foreground">开始采集文章后，记录将显示在这里</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>采集规则</TableHead>
                  <TableHead>源URL</TableHead>
                  <TableHead>生成文章</TableHead>
                  <TableHead>图片数</TableHead>
                  <TableHead>采集时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.scraper_rules?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.scraper_rules?.source_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={record.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 max-w-xs truncate"
                      >
                        <span className="truncate">{record.source_url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {record.articles ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => navigate(`/articles/${record.articles?.slug}`)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          {record.articles.title}
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.images_downloaded > 0 ? (
                        <div className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4 text-blue-600" />
                          <span>{record.images_downloaded}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{formatDate(record.created_at)}</p>
                        {record.completed_at && (
                          <p className="text-muted-foreground">
                            耗时: {Math.round((new Date(record.completed_at).getTime() - new Date(record.created_at).getTime()) / 1000)}秒
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.status === 'failed' && record.error_message && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: '错误信息',
                              description: record.error_message,
                              variant: 'destructive'
                            });
                          }}
                        >
                          查看错误
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
