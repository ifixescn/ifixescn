/**
 * AI批量生成详情页面
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  getAIBatchGeneration,
  getAIBatchGenerationArticles,
  updateAIBatchGeneration,
  createAIArticleGeneration,
  updateAIArticleGeneration,
  getAIArticleTemplate,
} from '@/db/api';
import { generateArticle } from '@/utils/ai-article-generator';
import type { AIBatchGenerationWithTemplate, AIArticleGenerationWithCategory, AIArticleTemplateWithCategory } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function AIBatchGenerationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [batch, setBatch] = useState<AIBatchGenerationWithTemplate | null>(null);
  const [articles, setArticles] = useState<AIArticleGenerationWithCategory[]>([]);
  const [template, setTemplate] = useState<AIArticleTemplateWithCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const batchData = await getAIBatchGeneration(id);
      if (!batchData) {
        toast({
          title: '任务不存在',
          variant: 'destructive',
        });
        navigate('/admin/ai-batch-generation');
        return;
      }

      setBatch(batchData);

      // 加载模板
      if (batchData.template_id) {
        const templateData = await getAIArticleTemplate(batchData.template_id);
        setTemplate(templateData);
      }

      // 加载已生成的文章
      const articlesData = await getAIBatchGenerationArticles(id);
      setArticles(articlesData);
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

  const handleStartGeneration = async () => {
    if (!batch || !id) return;

    setProcessing(true);

    try {
      // 更新批次状态为处理中
      await updateAIBatchGeneration(id, {
        status: 'processing',
      });

      let completed = 0;
      let failed = 0;

      // 逐个生成文章
      for (const keyword of batch.keywords_list) {
        setCurrentKeyword(keyword);

        try {
          // 创建生成记录
          const generation = await createAIArticleGeneration({
            keywords: keyword,
            batch_id: id,
            template_id: batch.template_id || undefined,
            category_id: template?.category_id || undefined,
            article_length: template?.article_length || 'medium',
            article_style: template?.article_style || 'professional',
            ai_temperature: template?.ai_temperature || 0.7,
            ai_top_p: template?.ai_top_p || 0.9,
            enable_seo: template?.enable_seo ?? true,
            enable_auto_format: template?.enable_auto_format ?? true,
          });

          // 调用AI生成
          const result = await generateArticle({
            keywords: keyword,
            length: template?.article_length || 'medium',
            style: template?.article_style || 'professional',
            temperature: template?.ai_temperature || 0.7,
            top_p: template?.ai_top_p || 0.9,
            enable_seo: template?.enable_seo ?? true,
            enable_auto_format: template?.enable_auto_format ?? true,
          });

          // 更新生成记录
          await updateAIArticleGeneration(generation.id, {
            generated_title: result.title,
            generated_summary: result.summary,
            generated_content: result.content,
            seo_keywords: result.seoKeywords?.join(', ') || null,
            seo_description: result.seoDescription || null,
            status: 'completed',
          });

          completed++;
        } catch (error) {
          console.error(`生成失败: ${keyword}`, error);
          failed++;
        }

        // 更新批次进度
        await updateAIBatchGeneration(id, {
          completed_count: completed,
          failed_count: failed,
        });
      }

      // 更新批次状态为完成
      await updateAIBatchGeneration(id, {
        status: 'completed',
        completed_count: completed,
        failed_count: failed,
      });

      toast({
        title: '批量生成完成',
        description: `成功: ${completed}, 失败: ${failed}`,
      });

      loadData();
    } catch (error) {
      toast({
        title: '批量生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });

      if (id) {
        await updateAIBatchGeneration(id, {
          status: 'failed',
        });
      }
    } finally {
      setProcessing(false);
      setCurrentKeyword('');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!batch) {
    return null;
  }

  const progress = batch.total_count > 0
    ? Math.round(((batch.completed_count + batch.failed_count) / batch.total_count) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/ai-batch-generation')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{batch.batch_name}</h1>
          <p className="text-muted-foreground mt-2">
            创建于 {format(new Date(batch.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
          </p>
        </div>
        {batch.status === 'pending' && !processing && (
          <Button onClick={handleStartGeneration}>
            <Play className="w-4 h-4 mr-2" />
            开始生成
          </Button>
        )}
      </div>

      {/* 任务信息 */}
      <Card>
        <CardHeader>
          <CardTitle>任务信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {template && (
            <div>
              <span className="text-sm text-muted-foreground">使用模板：</span>
              <Badge variant="outline" className="ml-2">{template.name}</Badge>
            </div>
          )}

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

          {processing && currentKeyword && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              正在生成: {currentKeyword}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 关键词列表 */}
      <Card>
        <CardHeader>
          <CardTitle>关键词列表</CardTitle>
          <CardDescription>共 {batch.keywords_list.length} 个关键词</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {batch.keywords_list.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 生成结果 */}
      {articles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>已生成 {articles.length} 篇文章</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {article.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : article.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{article.generated_title || article.keywords}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(article.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </p>
                    </div>
                  </div>
                  {article.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/admin/ai-article-generator?id=${article.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
