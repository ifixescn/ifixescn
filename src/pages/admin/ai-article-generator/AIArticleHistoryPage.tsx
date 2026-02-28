/**
 * AI文章生成历史记录页面
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Eye, Trash2, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getAIArticleGenerations,
  deleteAIArticleGeneration,
  publishArticleFromAIGeneration,
} from '@/db/api';
import type { AIArticleGenerationWithCategory } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export default function AIArticleHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [generations, setGenerations] = useState<AIArticleGenerationWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGeneration, setSelectedGeneration] =
    useState<AIArticleGenerationWithCategory | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    try {
      setLoading(true);
      const data = await getAIArticleGenerations(1, 50);
      setGenerations(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
      toast({
        title: '加载失败',
        description: '无法加载历史记录',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      await deleteAIArticleGeneration(id);
      toast({
        title: '删除成功',
        description: '记录已删除',
      });
      loadGenerations();
    } catch (error) {
      console.error('删除失败:', error);
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const article = await publishArticleFromAIGeneration(id);
      toast({
        title: '发布成功',
        description: '文章已成功发布',
      });
      navigate(`/admin/articles/${article.id}/edit`);
    } catch (error) {
      console.error('发布失败:', error);
      toast({
        title: '发布失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (generation: AIArticleGenerationWithCategory) => {
    setSelectedGeneration(generation);
    setPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'generating':
        return (
          <Badge variant="secondary">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            生成中
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已完成
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            失败
          </Badge>
        );
      case 'published':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            已发布
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLengthLabel = (length: string) => {
    switch (length) {
      case 'short':
        return '短文';
      case 'medium':
        return '中等';
      case 'long':
        return '长文';
      default:
        return length;
    }
  };

  const getStyleLabel = (style: string) => {
    switch (style) {
      case 'formal':
        return '正式';
      case 'casual':
        return '轻松';
      case 'professional':
        return '专业';
      case 'creative':
        return '创意';
      default:
        return style;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="w-8 h-8 text-primary" />
            生成历史
          </h1>
          <p className="text-muted-foreground mt-2">查看所有AI文章生成记录</p>
        </div>
        <Button onClick={() => navigate('/admin/ai-article-generator')}>
          <FileText className="w-4 h-4 mr-2" />
          新建生成
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
          <CardDescription>共 {generations.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无生成记录</p>
              <Button
                onClick={() => navigate('/admin/ai-article-generator')}
                className="mt-4"
                variant="outline"
              >
                开始生成
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>关键词</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>长度</TableHead>
                    <TableHead>风格</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generations.map((generation) => (
                    <TableRow key={generation.id}>
                      <TableCell className="font-medium">{generation.keywords}</TableCell>
                      <TableCell>
                        {generation.generated_title || (
                          <span className="text-muted-foreground">未生成</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {generation.category?.name || (
                          <span className="text-muted-foreground">无</span>
                        )}
                      </TableCell>
                      <TableCell>{getLengthLabel(generation.article_length)}</TableCell>
                      <TableCell>{getStyleLabel(generation.article_style)}</TableCell>
                      <TableCell>{getStatusBadge(generation.status)}</TableCell>
                      <TableCell>
                        {format(new Date(generation.created_at), 'yyyy-MM-dd HH:mm', {
                          locale: zhCN,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {generation.status === 'completed' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePreview(generation)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handlePublish(generation.id)}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {generation.status === 'published' && generation.published_article && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/admin/articles/${generation.published_article_id}/edit`)
                              }
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(generation.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览对话框 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>文章预览</DialogTitle>
            <DialogDescription>
              {selectedGeneration && (
                <div className="flex items-center gap-2 mt-2">
                  <span>关键词: {selectedGeneration.keywords}</span>
                  <span>•</span>
                  <span>{getLengthLabel(selectedGeneration.article_length)}</span>
                  <span>•</span>
                  <span>{getStyleLabel(selectedGeneration.article_style)}</span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedGeneration && (
            <div className="space-y-4">
              {/* 标题 */}
              {selectedGeneration.generated_title && (
                <div>
                  <h3 className="text-2xl font-bold">{selectedGeneration.generated_title}</h3>
                </div>
              )}

              {/* 摘要 */}
              {selectedGeneration.generated_summary && (
                <div>
                  <p className="text-muted-foreground">{selectedGeneration.generated_summary}</p>
                </div>
              )}

              {/* 正文 */}
              {selectedGeneration.generated_content && (
                <div className="rich-content">
                  <ReactMarkdown>{selectedGeneration.generated_content}</ReactMarkdown>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    handlePublish(selectedGeneration.id);
                    setPreviewOpen(false);
                  }}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  发布文章
                </Button>
                <Button onClick={() => setPreviewOpen(false)} variant="outline">
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
