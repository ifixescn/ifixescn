import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { upsertPageSEO } from "@/db/api";
import type { PageSEO, PageSEOFormData, ChangeFrequency } from "@/types";

interface PageSEOFormProps {
  page: PageSEO | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PageSEOForm({ page, onSuccess, onCancel }: PageSEOFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PageSEOFormData>({
    defaultValues: {
      page_path: page?.page_path || '',
      page_title: page?.page_title || '',
      page_description: page?.page_description || '',
      page_keywords: page?.page_keywords || '',
      og_title: page?.og_title || '',
      og_description: page?.og_description || '',
      og_image: page?.og_image || '',
      twitter_title: page?.twitter_title || '',
      twitter_description: page?.twitter_description || '',
      twitter_image: page?.twitter_image || '',
      canonical_url: page?.canonical_url || '',
      noindex: page?.noindex || false,
      nofollow: page?.nofollow || false,
      priority: page?.priority || 0.5,
      change_frequency: page?.change_frequency || 'weekly',
    },
  });

  const noindex = watch("noindex");
  const nofollow = watch("nofollow");

  useEffect(() => {
    if (page) {
      reset({
        page_path: page.page_path,
        page_title: page.page_title || '',
        page_description: page.page_description || '',
        page_keywords: page.page_keywords || '',
        og_title: page.og_title || '',
        og_description: page.og_description || '',
        og_image: page.og_image || '',
        twitter_title: page.twitter_title || '',
        twitter_description: page.twitter_description || '',
        twitter_image: page.twitter_image || '',
        canonical_url: page.canonical_url || '',
        noindex: page.noindex,
        nofollow: page.nofollow,
        priority: page.priority,
        change_frequency: page.change_frequency,
      });
    }
  }, [page, reset]);

  const onSubmit = async (data: PageSEOFormData) => {
    try {
      setLoading(true);
      const success = await upsertPageSEO(data);
      
      if (success) {
        toast({
          title: "保存成功",
          description: `页面 SEO 设置已${page ? '更新' : '创建'}`,
        });
        onSuccess();
      } else {
        throw new Error("保存失败");
      }
    } catch (error) {
      console.error("保存页面 SEO 设置失败:", error);
      toast({
        title: "保存失败",
        description: "无法保存页面 SEO 设置，请重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="basic">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="og">Open Graph</TabsTrigger>
          <TabsTrigger value="twitter">Twitter Card</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
        </TabsList>

        {/* 基本信息 */}
        <TabsContent value="basic" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="page_path">页面路径 *</Label>
            <Input
              id="page_path"
              {...register("page_path", { required: "请输入页面路径" })}
              placeholder="/about"
              disabled={!!page}
            />
            {errors.page_path && (
              <p className="text-sm text-destructive">{errors.page_path.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              页面的 URL 路径，例如：/about、/products、/articles/123
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_title">页面标题</Label>
            <Input
              id="page_title"
              {...register("page_title")}
              placeholder="关于我们 - iFixes"
            />
            <p className="text-sm text-muted-foreground">
              建议长度：50-60 个字符
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_description">页面描述</Label>
            <Textarea
              id="page_description"
              {...register("page_description")}
              placeholder="了解 iFixes 的使命、愿景和团队..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              建议长度：150-160 个字符
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page_keywords">页面关键词</Label>
            <Input
              id="page_keywords"
              {...register("page_keywords")}
              placeholder="关于我们, 公司介绍, 团队"
            />
            <p className="text-sm text-muted-foreground">
              使用逗号分隔多个关键词
            </p>
          </div>
        </TabsContent>

        {/* Open Graph */}
        <TabsContent value="og" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="og_title">OG 标题</Label>
            <Input
              id="og_title"
              {...register("og_title")}
              placeholder="关于我们 - iFixes"
            />
            <p className="text-sm text-muted-foreground">
              在社交媒体上分享时显示的标题
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="og_description">OG 描述</Label>
            <Textarea
              id="og_description"
              {...register("og_description")}
              placeholder="了解 iFixes 的使命、愿景和团队..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              在社交媒体上分享时显示的描述
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="og_image">OG 图片 URL</Label>
            <Input
              id="og_image"
              {...register("og_image")}
              placeholder="https://example.com/og-image.jpg"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              建议尺寸：1200x630 像素
            </p>
          </div>
        </TabsContent>

        {/* Twitter Card */}
        <TabsContent value="twitter" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="twitter_title">Twitter 标题</Label>
            <Input
              id="twitter_title"
              {...register("twitter_title")}
              placeholder="关于我们 - iFixes"
            />
            <p className="text-sm text-muted-foreground">
              在 Twitter 上分享时显示的标题
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_description">Twitter 描述</Label>
            <Textarea
              id="twitter_description"
              {...register("twitter_description")}
              placeholder="了解 iFixes 的使命、愿景和团队..."
              rows={3}
            />
            <p className="text-sm text-muted-foreground">
              在 Twitter 上分享时显示的描述
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter_image">Twitter 图片 URL</Label>
            <Input
              id="twitter_image"
              {...register("twitter_image")}
              placeholder="https://example.com/twitter-image.jpg"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              建议尺寸：1200x675 像素
            </p>
          </div>
        </TabsContent>

        {/* 高级设置 */}
        <TabsContent value="advanced" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="canonical_url">规范 URL</Label>
            <Input
              id="canonical_url"
              {...register("canonical_url")}
              placeholder="https://example.com/about"
              type="url"
            />
            <p className="text-sm text-muted-foreground">
              指定页面的规范 URL，用于避免重复内容问题
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">站点地图优先级</Label>
            <Input
              id="priority"
              {...register("priority", { 
                valueAsNumber: true,
                min: { value: 0, message: "优先级最小为 0" },
                max: { value: 1, message: "优先级最大为 1" },
              })}
              type="number"
              step="0.1"
              min="0"
              max="1"
            />
            {errors.priority && (
              <p className="text-sm text-destructive">{errors.priority.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              范围：0.0 - 1.0，数值越大优先级越高
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="change_frequency">更新频率</Label>
            <Select
              value={watch("change_frequency")}
              onValueChange={(value) => setValue("change_frequency", value as ChangeFrequency)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">总是</SelectItem>
                <SelectItem value="hourly">每小时</SelectItem>
                <SelectItem value="daily">每天</SelectItem>
                <SelectItem value="weekly">每周</SelectItem>
                <SelectItem value="monthly">每月</SelectItem>
                <SelectItem value="yearly">每年</SelectItem>
                <SelectItem value="never">从不</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              告诉搜索引擎页面的更新频率
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="noindex">禁止索引</Label>
              <p className="text-sm text-muted-foreground">
                阻止搜索引擎索引此页面
              </p>
            </div>
            <Switch
              id="noindex"
              checked={noindex}
              onCheckedChange={(checked) => setValue("noindex", checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="nofollow">禁止跟踪链接</Label>
              <p className="text-sm text-muted-foreground">
                阻止搜索引擎跟踪此页面上的链接
              </p>
            </div>
            <Switch
              id="nofollow"
              checked={nofollow}
              onCheckedChange={(checked) => setValue("nofollow", checked)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  );
}
