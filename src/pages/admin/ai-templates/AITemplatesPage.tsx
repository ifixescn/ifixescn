/**
 * AI文章模板管理页面
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getAIArticleTemplates,
  deleteAIArticleTemplate,
} from '@/db/api';
import type { AIArticleTemplateWithCategory } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TemplateFormDialog } from './TemplateFormDialog';

export default function AITemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<AIArticleTemplateWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTemplate, setEditTemplate] = useState<AIArticleTemplateWithCategory | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getAIArticleTemplates();
      setTemplates(data);
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteAIArticleTemplate(deleteId);
      toast({
        title: '删除成功',
        description: '模板已删除',
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (template: AIArticleTemplateWithCategory) => {
    setEditTemplate(template);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditTemplate(null);
    setShowForm(true);
  };

  const handleFormClose = (success: boolean) => {
    setShowForm(false);
    setEditTemplate(null);
    if (success) {
      loadTemplates();
    }
  };

  const getLengthLabel = (length: string) => {
    const labels: Record<string, string> = {
      short: '短文',
      medium: '中等',
      long: '长文',
    };
    return labels[length] || length;
  };

  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      formal: '正式',
      casual: '轻松',
      professional: '专业',
      creative: '创意',
    };
    return labels[style] || style;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI文章模板</h1>
          <p className="text-muted-foreground mt-2">
            管理文章生成模板，快速复用常用配置
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          创建模板
        </Button>
      </div>

      {/* 模板列表 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">暂无模板</p>
            <Button onClick={handleCreate} variant="outline" className="mt-4">
              创建第一个模板
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 模板配置 */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">文章长度</span>
                    <Badge variant="secondary">{getLengthLabel(template.article_length)}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">写作风格</span>
                    <Badge variant="secondary">{getStyleLabel(template.article_style)}</Badge>
                  </div>
                  {template.category && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">默认分类</span>
                      <Badge variant="outline">{template.category.name}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">创造性</span>
                    <span className="text-sm">{template.ai_temperature.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">多样性</span>
                    <span className="text-sm">{template.ai_top_p.toFixed(1)}</span>
                  </div>
                </div>

                {/* 功能标签 */}
                <div className="flex flex-wrap gap-2">
                  {template.enable_seo && (
                    <Badge variant="default" className="text-xs">SEO优化</Badge>
                  )}
                  {template.enable_auto_format && (
                    <Badge variant="default" className="text-xs">自动排版</Badge>
                  )}
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(template.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除这个模板吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 模板表单对话框 */}
      {showForm && (
        <TemplateFormDialog
          template={editTemplate}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
