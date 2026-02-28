import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  ExternalLink,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
} from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScraperRule {
  id: string;
  name: string;
  description: string;
  source_url: string;
  source_name: string;
  status: 'active' | 'inactive' | 'testing';
  success_count: number;
  fail_count: number;
  last_run_at: string | null;
  download_images: boolean;
  auto_publish: boolean;
  created_at: string;
}

interface Stats {
  total_rules: number;
  active_rules: number;
  total_scraped: number;
  total_failed: number;
}

export default function ArticleScraperManage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rules, setRules] = useState<ScraperRule[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const [runningRules, setRunningRules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRules();
    loadStats();
  }, []);

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
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

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_scraper_stats');
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  const handleRunScraper = async (ruleId: string) => {
    setRunningRules(prev => new Set(prev).add(ruleId));
    
    try {
      const { data, error } = await supabase.functions.invoke('article-scraper', {
        body: { ruleId }
      });

      if (error) throw error;

      toast({
        title: '采集成功',
        description: `已成功采集文章，下载了 ${data.images_downloaded} 张图片`
      });

      loadRules();
      loadStats();
    } catch (error: any) {
      toast({
        title: '采集失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRunningRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    }
  };

  const handleToggleStatus = async (ruleId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('scraper_rules')
        .update({ status: newStatus })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: '状态已更新',
        description: `规则已${newStatus === 'active' ? '启用' : '停用'}`
      });

      loadRules();
    } catch (error: any) {
      toast({
        title: '更新失败',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;

    try {
      const { error } = await supabase
        .from('scraper_rules')
        .delete()
        .eq('id', ruleToDelete);

      if (error) throw error;

      toast({
        title: '删除成功',
        description: '采集规则已删除'
      });

      loadRules();
      loadStats();
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      active: { variant: 'default', label: '运行中' },
      inactive: { variant: 'secondary', label: '已停用' },
      testing: { variant: 'outline', label: '测试中' }
    };
    const config = variants[status] || variants.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold">文章采集系统</h1>
          <p className="text-muted-foreground mt-2">
            自动采集其他网站的文章，支持图片本地化和来源标注
          </p>
        </div>
        <Button onClick={() => navigate('/admin/article-scraper/new')}>
          <Plus className="w-4 h-4 mr-2" />
          新建采集规则
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总规则数</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_rules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">运行中</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_rules}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功采集</CardTitle>
              <Download className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_scraped}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">失败次数</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_failed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 规则列表 */}
      <div className="grid grid-cols-1 gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Download className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">还没有采集规则</h3>
              <p className="text-muted-foreground mb-4">创建第一个采集规则开始自动采集文章</p>
              <Button onClick={() => navigate('/admin/article-scraper/new')}>
                <Plus className="w-4 h-4 mr-2" />
                创建采集规则
              </Button>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle>{rule.name}</CardTitle>
                      {getStatusBadge(rule.status)}
                      {rule.download_images && (
                        <Badge variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          图片本地化
                        </Badge>
                      )}
                      {rule.auto_publish && (
                        <Badge variant="outline">自动发布</Badge>
                      )}
                    </div>
                    <CardDescription>{rule.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunScraper(rule.id)}
                      disabled={runningRules.has(rule.id)}
                    >
                      {runningRules.has(rule.id) ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          采集中...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          立即采集
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(rule.id, rule.status)}
                    >
                      {rule.status === 'active' ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          停用
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          启用
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/article-scraper/edit/${rule.id}`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRuleToDelete(rule.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">来源网站</p>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{rule.source_name}</span>
                      <a
                        href={rule.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">成功采集</p>
                    <p className="font-medium text-green-600">{rule.success_count} 篇</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">失败次数</p>
                    <p className="font-medium text-red-600">{rule.fail_count} 次</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">最后运行</p>
                    <p className="font-medium">
                      {rule.last_run_at
                        ? new Date(rule.last_run_at).toLocaleString('zh-CN')
                        : '从未运行'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个采集规则吗？此操作无法撤销，但已采集的文章不会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
