/**
 * 批量生成表单对话框
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  createAIBatchGeneration,
  getAIArticleTemplates,
} from '@/db/api';
import type { AIArticleTemplateWithCategory } from '@/types';

interface BatchGenerationFormDialogProps {
  onClose: (success: boolean) => void;
}

export function BatchGenerationFormDialog({ onClose }: BatchGenerationFormDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<AIArticleTemplateWithCategory[]>([]);

  const [batchName, setBatchName] = useState('');
  const [templateId, setTemplateId] = useState<string>('');
  const [keywordsText, setKeywordsText] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getAIArticleTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchName.trim()) {
      toast({
        title: '请输入任务名称',
        variant: 'destructive',
      });
      return;
    }

    if (!keywordsText.trim()) {
      toast({
        title: '请输入关键词列表',
        variant: 'destructive',
      });
      return;
    }

    // 解析关键词列表
    const keywordsList = keywordsText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (keywordsList.length === 0) {
      toast({
        title: '关键词列表不能为空',
        variant: 'destructive',
      });
      return;
    }

    if (keywordsList.length > 100) {
      toast({
        title: '关键词数量不能超过100个',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const batch = await createAIBatchGeneration({
        batch_name: batchName.trim(),
        template_id: templateId && templateId !== 'none' ? templateId : undefined,
        keywords_list: keywordsList,
      });

      toast({
        title: '创建成功',
        description: `已创建批量任务，共 ${keywordsList.length} 个关键词`,
      });

      // 跳转到批量任务详情页
      navigate(`/admin/ai-batch-generation/${batch.id}`);
      onClose(true);
    } catch (error) {
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新建批量生成任务</DialogTitle>
          <DialogDescription>
            输入多个关键词，系统将为每个关键词生成一篇文章
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">任务名称 *</Label>
            <Input
              id="batchName"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              placeholder="例如：2024年1月技术文章批量生成"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template">使用模板</Label>
            <Select
              value={templateId}
              onValueChange={setTemplateId}
              disabled={loading}
            >
              <SelectTrigger id="template">
                <SelectValue placeholder="选择模板（可选）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不使用模板</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              选择模板后，将使用模板中的配置参数生成文章
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">关键词列表 *</Label>
            <Textarea
              id="keywords"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="每行一个关键词，例如：&#10;React Hooks 最佳实践&#10;TypeScript 类型系统详解&#10;前端性能优化技巧"
              disabled={loading}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              每行一个关键词，最多100个。系统将为每个关键词生成一篇文章。
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建任务'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
