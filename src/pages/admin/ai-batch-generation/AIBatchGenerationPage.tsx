/**
 * AI批量生成页面
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  getAIBatchGenerations,
} from '@/db/api';
import type { AIBatchGenerationWithTemplate } from '@/types';
import { BatchGenerationFormDialog } from './BatchGenerationFormDialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function AIBatchGenerationPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [batches, setBatches] = useState<AIBatchGenerationWithTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const data = await getAIBatchGenerations();
      setBatches(data);
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = (success: boolean) => {
    setShowForm(false);
    if (success) {
      loadBatches();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待处理', variant: 'secondary' },
      processing: { label: '处理中', variant: 'default' },
      completed: { label: '已完成', variant: 'outline' },
      failed: { label: '失败', variant: 'destructive' },
    };
    const config = statusMap[status] || { label: status, variant: 'secondary' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-muted-foreground" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return null;
    }
  };

  const calculateProgress = (batch: AIBatchGenerationWithTemplate) => {
    if (batch.total_count === 0) return 0;
    return Math.round(((batch.completed_count + batch.failed_count) / batch.total_count) * 100);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI批量生成</h1>
          <p className="text-muted-foreground mt-2">
            批量生成多篇文章，提高内容生产效率
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          新建批量任务
        </Button>
      </div>

      {/* 批量任务列表 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Plus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无批量任务</p>
            <Button onClick={() => setShowForm(true)} variant="outline" className="mt-4">
              创建第一个批量任务
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {batches.map((batch) => {
            const progress = calculateProgress(batch);
            return (
              <Card key={batch.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getStatusIcon(batch.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{batch.batch_name}</CardTitle>
                          {getStatusBadge(batch.status)}
                        </div>
                        <CardDescription className="mt-1">
                          创建于 {format(new Date(batch.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/admin/ai-batch-generation/${batch.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 模板信息 */}
                  {batch.template && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">使用模板：</span>
                      <Badge variant="outline" className="ml-2">{batch.template.name}</Badge>
                    </div>
                  )}

                  {/* 进度信息 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">生成进度</span>
                      <span className="font-medium">
                        {batch.completed_count + batch.failed_count} / {batch.total_count}
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>成功: {batch.completed_count}</span>
                      {batch.failed_count > 0 && (
                        <span className="text-destructive">失败: {batch.failed_count}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 批量生成表单对话框 */}
      {showForm && (
        <BatchGenerationFormDialog onClose={handleFormClose} />
      )}
    </div>
  );
}
