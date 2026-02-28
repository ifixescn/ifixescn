import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, TestTube, HelpCircle, Eye } from 'lucide-react';
import { supabase } from '@/db/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VisualSelector from '@/components/scraper/VisualSelector';
import AntiScrapingConfigPanel from '@/components/scraper/AntiScrapingConfig';

interface FormData {
  name: string;
  description: string;
  source_url: string;
  source_name: string;
  title_selector: string;
  content_selector: string;
  excerpt_selector: string;
  cover_image_selector: string;
  author_selector: string;
  publish_date_selector: string;
  category_id: string;
  status: 'active' | 'inactive' | 'testing';
  auto_publish: boolean;
  download_images: boolean;
  add_source_link: boolean;
  anti_scraping_config: any;
  rate_limit_config: any;
  proxy_config: any;
}

interface Category {
  id: string;
  name: string;
}

export default function ArticleScraperEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [antiScrapingConfig, setAntiScrapingConfig] = useState({
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    delay_min: 2000,
    delay_max: 5000,
    use_referer: true,
    use_cookies: false,
    custom_headers: {},
    timeout: 30000,
    retry_times: 3,
    retry_delay: 5000
  });
  const [rateLimitConfig, setRateLimitConfig] = useState({
    max_requests_per_minute: 10,
    max_requests_per_hour: 100,
    concurrent_requests: 1
  });
  const [proxyConfig, setProxyConfig] = useState<{enabled: boolean; proxy_url: string | null; rotate_proxy: boolean}>({
    enabled: false,
    proxy_url: null,
    rotate_proxy: false
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      status: 'testing',
      auto_publish: false,
      download_images: true,
      add_source_link: true
    }
  });

  const downloadImages = watch('download_images');
  const autoPublish = watch('auto_publish');
  const addSourceLink = watch('add_source_link');
  const sourceUrl = watch('source_url');

  useEffect(() => {
    loadCategories();
    if (id) {
      loadRule();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('type', 'article')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('加载分类失败:', error);
    }
  };

  const loadRule = async () => {
    try {
      const { data, error } = await supabase
        .from('scraper_rules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      // 填充表单
      Object.keys(data).forEach((key) => {
        setValue(key as any, data[key]);
      });

      // 加载反爬虫配置
      if (data.anti_scraping_config) {
        setAntiScrapingConfig(data.anti_scraping_config);
      }
      if (data.rate_limit_config) {
        setRateLimitConfig(data.rate_limit_config);
      }
      if (data.proxy_config) {
        setProxyConfig(data.proxy_config);
      }
    } catch (error: any) {
      toast({
        title: '加载失败',
        description: error.message,
        variant: 'destructive'
      });
      navigate('/admin/article-scraper');
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        created_by: profile?.id,
        anti_scraping_config: antiScrapingConfig,
        rate_limit_config: rateLimitConfig,
        proxy_config: proxyConfig
      };

      if (id) {
        // 更新
        const { error } = await supabase
          .from('scraper_rules')
          .update(payload)
          .eq('id', id);

        if (error) throw error;

        toast({
          title: '保存成功',
          description: '采集规则已更新'
        });
      } else {
        // 创建
        const { error } = await supabase
          .from('scraper_rules')
          .insert(payload);

        if (error) throw error;

        toast({
          title: '创建成功',
          description: '采集规则已创建'
        });
      }

      navigate('/admin/article-scraper');
    } catch (error: any) {
      toast({
        title: '保存失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectorSelected = (selector: string, type: 'title' | 'content' | 'excerpt' | 'cover' | 'author' | 'date') => {
    const fieldMap: Record<string, string> = {
      title: 'title_selector',
      content: 'content_selector',
      excerpt: 'excerpt_selector',
      cover: 'cover_image_selector',
      author: 'author_selector',
      date: 'publish_date_selector'
    };
    
    const fieldName = fieldMap[type];
    if (fieldName) {
      setValue(fieldName as any, selector);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // 先保存规则
      const formData = watch();
      const { data: rule, error: saveError } = await supabase
        .from('scraper_rules')
        .upsert({
          ...formData,
          id: id || undefined,
          created_by: profile?.id,
          status: 'testing'
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 执行测试采集
      const { data, error } = await supabase.functions.invoke('article-scraper', {
        body: { ruleId: rule.id }
      });

      if (error) throw error;

      toast({
        title: '测试成功',
        description: `成功采集文章，下载了 ${data.images_downloaded} 张图片`,
      });
    } catch (error: any) {
      toast({
        title: '测试失败',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/admin/article-scraper')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{id ? '编辑' : '新建'}采集规则</h1>
          <p className="text-muted-foreground mt-2">
            配置CSS选择器来提取网页内容
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">基本配置</TabsTrigger>
            <TabsTrigger value="visual">可视化选择</TabsTrigger>
            <TabsTrigger value="anti-scraping">反爬虫配置</TabsTrigger>
            <TabsTrigger value="advanced">高级选项</TabsTrigger>
          </TabsList>

          {/* 基本配置 Tab */}
          <TabsContent value="basic" className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>设置采集规则的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">规则名称 *</Label>
                <Input
                  id="name"
                  {...register('name', { required: '请输入规则名称' })}
                  placeholder="例如：科技博客采集"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_name">来源网站名称 *</Label>
                <Input
                  id="source_name"
                  {...register('source_name', { required: '请输入来源网站名称' })}
                  placeholder="例如：TechCrunch"
                />
                {errors.source_name && (
                  <p className="text-sm text-red-600">{errors.source_name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">规则描述</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="描述这个采集规则的用途"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="source_url">源网站URL *</Label>
              <Input
                id="source_url"
                {...register('source_url', { required: '请输入源网站URL' })}
                placeholder="https://example.com/article/123"
              />
              {errors.source_url && (
                <p className="text-sm text-red-600">{errors.source_url.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                输入要采集的文章URL，用于测试和单篇采集
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">默认分类</Label>
              <Select
                value={watch('category_id')}
                onValueChange={(value) => setValue('category_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* CSS选择器配置 */}
        <Card>
          <CardHeader>
            <CardTitle>内容提取规则</CardTitle>
            <CardDescription>
              使用CSS选择器来定位网页中的内容元素
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 ml-2 inline-block cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>CSS选择器示例：</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>h1.title - 选择class为title的h1标签</li>
                      <li>#content - 选择id为content的元素</li>
                      <li>{'div.article > p'} - 选择article类下的p标签</li>
                      <li>img[src] - 选择有src属性的img标签</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title_selector">标题选择器 *</Label>
                <Input
                  id="title_selector"
                  {...register('title_selector', { required: '请输入标题选择器' })}
                  placeholder="h1.article-title"
                />
                {errors.title_selector && (
                  <p className="text-sm text-red-600">{errors.title_selector.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_image_selector">封面图选择器</Label>
                <Input
                  id="cover_image_selector"
                  {...register('cover_image_selector')}
                  placeholder="img.cover-image"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content_selector">内容选择器 *</Label>
              <Input
                id="content_selector"
                {...register('content_selector', { required: '请输入内容选择器' })}
                placeholder="div.article-content"
              />
              {errors.content_selector && (
                <p className="text-sm text-red-600">{errors.content_selector.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="excerpt_selector">摘要选择器</Label>
                <Input
                  id="excerpt_selector"
                  {...register('excerpt_selector')}
                  placeholder="div.article-excerpt"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_selector">作者选择器</Label>
                <Input
                  id="author_selector"
                  {...register('author_selector')}
                  placeholder="span.author-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish_date_selector">发布日期选择器</Label>
              <Input
                id="publish_date_selector"
                {...register('publish_date_selector')}
                placeholder="time.publish-date"
              />
            </div>
          </CardContent>
        </Card>

        {/* 采集选项 */}
        <Card>
          <CardHeader>
            <CardTitle>采集选项</CardTitle>
            <CardDescription>配置采集行为和文章处理方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>图片本地化</Label>
                <p className="text-sm text-muted-foreground">
                  自动下载文章中的图片到本地存储
                </p>
              </div>
              <Switch
                checked={downloadImages}
                onCheckedChange={(checked) => setValue('download_images', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>自动发布</Label>
                <p className="text-sm text-muted-foreground">
                  采集完成后自动发布文章，否则保存为草稿
                </p>
              </div>
              <Switch
                checked={autoPublish}
                onCheckedChange={(checked) => setValue('auto_publish', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>添加来源链接</Label>
                <p className="text-sm text-muted-foreground">
                  在文章末尾添加原文链接
                </p>
              </div>
              <Switch
                checked={addSourceLink}
                onCheckedChange={(checked) => setValue('add_source_link', checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">规则状态</Label>
              <Select
                value={watch('status')}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testing">测试中</SelectItem>
                  <SelectItem value="active">运行中</SelectItem>
                  <SelectItem value="inactive">已停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* 可视化选择 Tab */}
          <TabsContent value="visual">
            <VisualSelector
              url={sourceUrl || ''}
              onSelectorSelected={handleSelectorSelected}
            />
          </TabsContent>

          {/* 反爬虫配置 Tab */}
          <TabsContent value="anti-scraping">
            <AntiScrapingConfigPanel
              antiScrapingConfig={antiScrapingConfig}
              rateLimitConfig={rateLimitConfig}
              proxyConfig={proxyConfig}
              onAntiScrapingConfigChange={setAntiScrapingConfig}
              onRateLimitConfigChange={setRateLimitConfig}
              onProxyConfigChange={setProxyConfig}
            />
          </TabsContent>

          {/* 高级选项 Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>高级选项</CardTitle>
                <CardDescription>
                  配置Cookie、自定义脚本等高级功能
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cookie配置</Label>
                  <Textarea
                    placeholder='[{"name": "session", "value": "xxx", "domain": ".example.com"}]'
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    JSON格式的Cookie数组，用于保持登录状态
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>自定义JavaScript（执行前）</Label>
                  <Textarea
                    placeholder="// 在采集前执行的JavaScript代码"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>自定义JavaScript（执行后）</Label>
                  <Textarea
                    placeholder="// 在采集后执行的JavaScript代码"
                    rows={4}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 操作按钮 */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? '保存中...' : '保存规则'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            <TestTube className="w-4 h-4 mr-2" />
            {testing ? '测试中...' : '测试采集'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/admin/article-scraper')}
          >
            取消
          </Button>
        </div>
      </form>
    </div>
  );
}
