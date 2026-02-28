/**
 * AI文章生成器页面
 * 提供傻瓜式的AI文章生成功能
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, CheckCircle2, XCircle, FileText, Eye, Edit, Save, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateArticle } from '@/utils/ai-article-generator';
import {
  createAIArticleGeneration,
  updateAIArticleGeneration,
  publishArticleFromAIGeneration,
  getCategories,
} from '@/db/api';
import type { Category, ArticleLength, ArticleStyle } from '@/types';
import ReactMarkdown from 'react-markdown';

export default function AIArticleGeneratorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // 表单状态
  const [keywords, setKeywords] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [articleLength, setArticleLength] = useState<ArticleLength>('medium');
  const [articleStyle, setArticleStyle] = useState<ArticleStyle>('professional');

  // 高级设置
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [enableSEO, setEnableSEO] = useState(true);
  const [enableAutoFormat, setEnableAutoFormat] = useState(true);

  // 生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [generationId, setGenerationId] = useState<string>('');
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [seoDescription, setSeoDescription] = useState('');

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [previewMode, setPreviewMode] = useState<'preview' | 'edit'>('preview');

  // 分类列表
  const [categories, setCategories] = useState<Category[]>([]);

  // 加载分类
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories('article');
      setCategories(data);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  // 生成文章
  const handleGenerate = async () => {
    if (!keywords.trim()) {
      toast({
        title: '请输入关键词',
        description: '关键词不能为空',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('正在初始化...');
    setGeneratedTitle('');
    setGeneratedSummary('');
    setGeneratedContent('');
    setSeoKeywords([]);
    setSeoDescription('');

    try {
      // 创建生成记录
      const generation = await createAIArticleGeneration({
        keywords,
        category_id: categoryId && categoryId !== 'none' ? categoryId : null,
        article_length: articleLength,
        article_style: articleStyle,
        ai_temperature: temperature,
        ai_top_p: topP,
        enable_seo: enableSEO,
        enable_auto_format: enableAutoFormat,
      });

      setGenerationId(generation.id);
      setGenerationProgress('正在生成文章...');

      // 调用AI生成
      const result = await generateArticle({
        keywords,
        length: articleLength,
        style: articleStyle,
        temperature,
        top_p: topP,
        enable_seo: enableSEO,
        enable_auto_format: enableAutoFormat,
        onProgress: (content) => {
          setGenerationProgress('AI正在创作中...');
          setGeneratedContent(content);
        },
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

      setGeneratedTitle(result.title);
      setGeneratedSummary(result.summary);
      setGeneratedContent(result.content);
      setSeoKeywords(result.seoKeywords || []);
      setSeoDescription(result.seoDescription || '');

      toast({
        title: '生成成功',
        description: '文章已生成完成，您可以预览或直接发布',
      });
    } catch (error) {
      console.error('生成失败:', error);

      if (generationId) {
        await updateAIArticleGeneration(generationId, {
          status: 'failed',
          error_message: error instanceof Error ? error.message : '生成失败',
        });
      }

      toast({
        title: '生成失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress('');
    }
  };

  // 发布文章
  const handlePublish = async () => {
    if (!generationId) {
      toast({
        title: '无法发布',
        description: '没有可发布的文章',
        variant: 'destructive',
      });
      return;
    }

    try {
      const article = await publishArticleFromAIGeneration(generationId);

      toast({
        title: '发布成功',
        description: '文章已成功发布到文章模块',
      });

      // 跳转到文章编辑页面
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

  // 重新生成
  const handleRegenerate = () => {
    setGeneratedTitle('');
    setGeneratedSummary('');
    setGeneratedContent('');
    setGenerationId('');
    setIsEditing(false);
    setEditedTitle('');
    setEditedSummary('');
    setEditedContent('');
  };

  // 进入编辑模式
  const handleStartEdit = () => {
    setEditedTitle(generatedTitle);
    setEditedSummary(generatedSummary);
    setEditedContent(generatedContent);
    setIsEditing(true);
    setPreviewMode('edit');
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!generationId) {
      toast({
        title: '保存失败',
        description: '没有可保存的生成记录',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateAIArticleGeneration(generationId, {
        generated_title: editedTitle,
        generated_summary: editedSummary,
        generated_content: editedContent,
      });

      setGeneratedTitle(editedTitle);
      setGeneratedSummary(editedSummary);
      setGeneratedContent(editedContent);
      setIsEditing(false);
      setPreviewMode('preview');

      toast({
        title: '保存成功',
        description: '编辑内容已保存',
      });
    } catch (error) {
      console.error('保存失败:', error);
      toast({
        title: '保存失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setPreviewMode('preview');
    setEditedTitle('');
    setEditedSummary('');
    setEditedContent('');
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          AI文章生成器
        </h1>
        <p className="text-muted-foreground mt-2">
          使用AI技术，根据关键词自动生成高质量文章内容
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：生成设置 */}
        <Card>
          <CardHeader>
            <CardTitle>生成设置</CardTitle>
            <CardDescription>配置文章生成参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 关键词 */}
            <div className="space-y-2">
              <Label htmlFor="keywords">
                关键词 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="keywords"
                placeholder="例如：人工智能、云计算、数字化转型"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-sm text-muted-foreground">
                输入文章的核心关键词，多个关键词用逗号分隔
              </p>
            </div>

            {/* 分类 */}
            <div className="space-y-2">
              <Label htmlFor="category">文章分类</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isGenerating}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择分类（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不选择分类</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 文章长度 */}
            <div className="space-y-2">
              <Label htmlFor="length">文章长度</Label>
              <Select
                value={articleLength}
                onValueChange={(value) => setArticleLength(value as ArticleLength)}
                disabled={isGenerating}
              >
                <SelectTrigger id="length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短文 (500-800字)</SelectItem>
                  <SelectItem value="medium">中等 (1000-1500字)</SelectItem>
                  <SelectItem value="long">长文 (2000-3000字)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 写作风格 */}
            <div className="space-y-2">
              <Label htmlFor="style">写作风格</Label>
              <Select
                value={articleStyle}
                onValueChange={(value) => setArticleStyle(value as ArticleStyle)}
                disabled={isGenerating}
              >
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">正式 - 严谨专业</SelectItem>
                  <SelectItem value="casual">轻松 - 亲切随意</SelectItem>
                  <SelectItem value="professional">专业 - 权威深入</SelectItem>
                  <SelectItem value="creative">创意 - 生动有趣</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 高级设置 */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between" type="button">
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    高级设置
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* AI温度参数 */}
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
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    较低值使输出更确定，较高值使输出更随机和创造性
                  </p>
                </div>

                {/* AI top_p参数 */}
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
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-muted-foreground">
                    控制输出的多样性，较低值使输出更集中
                  </p>
                </div>

                {/* SEO优化 */}
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
                    disabled={isGenerating}
                  />
                </div>

                {/* 自动排版 */}
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
                    disabled={isGenerating}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* 生成按钮 */}
            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !keywords.trim()}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    开始生成
                  </>
                )}
              </Button>

              {generatedContent && !isGenerating && (
                <Button onClick={handleRegenerate} variant="outline">
                  重新生成
                </Button>
              )}
            </div>

            {/* 生成进度 */}
            {isGenerating && generationProgress && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {generationProgress}
              </div>
            )}

            {/* 生成状态 */}
            {!isGenerating && generatedContent && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                文章生成完成
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：生成结果 */}
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
            <CardDescription>预览生成的文章内容</CardDescription>
          </CardHeader>
          <CardContent>
            {!generatedContent && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  配置生成参数后，点击"开始生成"按钮
                </p>
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">AI正在创作中，请稍候...</p>
              </div>
            )}

            {generatedContent && !isGenerating && (
              <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as 'preview' | 'edit')} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="preview">
                      <Eye className="w-4 h-4 mr-2" />
                      预览
                    </TabsTrigger>
                    <TabsTrigger value="edit">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="preview" className="space-y-4 mt-4">
                  {/* 标题 */}
                  {generatedTitle && (
                    <div>
                      <Label className="text-xs text-muted-foreground">标题</Label>
                      <h2 className="text-2xl font-bold mt-1">{generatedTitle}</h2>
                    </div>
                  )}

                  {/* 摘要 */}
                  {generatedSummary && (
                    <div>
                      <Label className="text-xs text-muted-foreground">摘要</Label>
                      <p className="text-muted-foreground mt-1">{generatedSummary}</p>
                    </div>
                  )}

                  <Separator />

                  {/* 正文 */}
                  <div>
                    <Label className="text-xs text-muted-foreground">正文</Label>
                    <div className="rich-content mt-2">
                      <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                  </div>

                  {/* SEO信息 */}
                  {enableSEO && (seoKeywords.length > 0 || seoDescription) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <Label className="text-xs text-muted-foreground">SEO信息</Label>
                        
                        {seoKeywords.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">关键词</p>
                            <div className="flex flex-wrap gap-2">
                              {seoKeywords.map((keyword, index) => (
                                <Badge key={index} variant="secondary">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {seoDescription && (
                          <div>
                            <p className="text-sm font-medium mb-2">SEO描述</p>
                            <p className="text-sm text-muted-foreground">{seoDescription}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button onClick={handlePublish} className="flex-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      发布文章
                    </Button>
                    <Button onClick={handleStartEdit} variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      编辑
                    </Button>
                    <Button
                      onClick={() => navigate('/admin/ai-article-generator/history')}
                      variant="outline"
                    >
                      查看历史
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="edit" className="space-y-4 mt-4">
                  {/* 编辑标题 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">标题</Label>
                    <Input
                      id="edit-title"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="输入文章标题"
                    />
                  </div>

                  {/* 编辑摘要 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-summary">摘要</Label>
                    <Textarea
                      id="edit-summary"
                      value={editedSummary}
                      onChange={(e) => setEditedSummary(e.target.value)}
                      placeholder="输入文章摘要"
                      rows={3}
                    />
                  </div>

                  {/* 编辑正文 */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">正文（Markdown格式）</Label>
                    <Textarea
                      id="edit-content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="输入文章正文，支持Markdown格式"
                      rows={20}
                      className="font-mono text-sm"
                    />
                  </div>

                  <Separator />

                  {/* 编辑操作按钮 */}
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      保存编辑
                    </Button>
                    <Button onClick={handleCancelEdit} variant="outline">
                      <X className="w-4 h-4 mr-2" />
                      取消
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 使用提示 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">使用提示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">1</Badge>
                输入关键词
              </h4>
              <p className="text-sm text-muted-foreground">
                输入文章的核心关键词，可以是多个，用逗号分隔
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">2</Badge>
                选择参数
              </h4>
              <p className="text-sm text-muted-foreground">
                选择文章分类、长度和写作风格
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">3</Badge>
                生成文章
              </h4>
              <p className="text-sm text-muted-foreground">
                点击"开始生成"，AI将自动创作文章
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-medium flex items-center gap-2">
                <Badge variant="outline">4</Badge>
                发布或编辑
              </h4>
              <p className="text-sm text-muted-foreground">
                预览满意后可直接发布，或跳转到编辑页面修改
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
