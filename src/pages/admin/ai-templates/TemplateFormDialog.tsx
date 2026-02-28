/**
 * AI文章模板表单对话框
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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
  createAIArticleTemplate,
  updateAIArticleTemplate,
  getCategories,
} from '@/db/api';
import type { AIArticleTemplateWithCategory, Category, ArticleLength, ArticleStyle } from '@/types';

interface TemplateFormDialogProps {
  template: AIArticleTemplateWithCategory | null;
  onClose: (success: boolean) => void;
}

export function TemplateFormDialog({ template, onClose }: TemplateFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [keywordsTemplate, setKeywordsTemplate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [articleLength, setArticleLength] = useState<ArticleLength>('medium');
  const [articleStyle, setArticleStyle] = useState<ArticleStyle>('professional');
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [enableSEO, setEnableSEO] = useState(true);
  const [enableAutoFormat, setEnableAutoFormat] = useState(true);

  useEffect(() => {
    loadCategories();
    if (template) {
      setName(template.name);
      setDescription(template.description || '');
      setKeywordsTemplate(template.keywords_template || '');
      setCategoryId(template.category_id || '');
      setArticleLength(template.article_length);
      setArticleStyle(template.article_style);
      setTemperature(template.ai_temperature);
      setTopP(template.ai_top_p);
      setEnableSEO(template.enable_seo);
      setEnableAutoFormat(template.enable_auto_format);
    }
  }, [template]);

  const loadCategories = async () => {
    try {
      // 只加载文章分类
      const data = await getCategories('article');
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '请输入模板名称',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        keywords_template: keywordsTemplate.trim() || undefined,
        category_id: categoryId && categoryId !== 'none' ? categoryId : undefined,
        article_length: articleLength,
        article_style: articleStyle,
        ai_temperature: temperature,
        ai_top_p: topP,
        enable_seo: enableSEO,
        enable_auto_format: enableAutoFormat,
      };

      if (template) {
        await updateAIArticleTemplate(template.id, data);
        toast({
          title: '更新成功',
          description: '模板已更新',
        });
      } else {
        await createAIArticleTemplate(data);
        toast({
          title: '创建成功',
          description: '模板已创建',
        });
      }

      onClose(true);
    } catch (error) {
      toast({
        title: template ? '更新失败' : '创建失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? '编辑模板' : '创建模板'}</DialogTitle>
          <DialogDescription>
            配置文章生成模板，方便快速复用
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息 */}
          <div className="space-y-2">
            <Label htmlFor="name">模板名称 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：技术博客模板"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">模板描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述这个模板的用途"
              disabled={loading}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">关键词模板</Label>
            <Input
              id="keywords"
              value={keywordsTemplate}
              onChange={(e) => setKeywordsTemplate(e.target.value)}
              placeholder="例如：{主题} 技术分享"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              使用 {'{主题}'} 作为占位符，批量生成时会自动替换
            </p>
          </div>

          {/* 文章配置 */}
          <div className="space-y-2">
            <Label htmlFor="category">默认分类</Label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              disabled={loading}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不指定</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length">文章长度</Label>
              <Select
                value={articleLength}
                onValueChange={(value) => setArticleLength(value as ArticleLength)}
                disabled={loading}
              >
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短文 (500字)</SelectItem>
                  <SelectItem value="medium">中等 (1000字)</SelectItem>
                  <SelectItem value="long">长文 (2000字)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">写作风格</Label>
              <Select
                value={articleStyle}
                onValueChange={(value) => setArticleStyle(value as ArticleStyle)}
                disabled={loading}
              >
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">正式</SelectItem>
                  <SelectItem value="casual">轻松</SelectItem>
                  <SelectItem value="professional">专业</SelectItem>
                  <SelectItem value="creative">创意</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI参数 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>创造性 (Temperature)</Label>
              <span className="text-sm text-muted-foreground">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              min={0}
              max={1}
              step={0.1}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>多样性 (Top P)</Label>
              <span className="text-sm text-muted-foreground">{topP.toFixed(2)}</span>
            </div>
            <Slider
              value={[topP]}
              onValueChange={(value) => setTopP(value[0])}
              min={0}
              max={1}
              step={0.1}
              disabled={loading}
            />
          </div>

          {/* 功能开关 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SEO优化</Label>
              <p className="text-xs text-muted-foreground">
                自动优化标题、提取关键词和生成描述
              </p>
            </div>
            <Switch
              checked={enableSEO}
              onCheckedChange={setEnableSEO}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动排版</Label>
              <p className="text-xs text-muted-foreground">
                清理多余空格、空行和重复字符
              </p>
            </div>
            <Switch
              checked={enableAutoFormat}
              onCheckedChange={setEnableAutoFormat}
              disabled={loading}
            />
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
              {loading ? '保存中...' : template ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
