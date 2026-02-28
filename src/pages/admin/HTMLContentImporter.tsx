import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCategories, createArticle, getCurrentUser } from "@/db/api";
import type { Category, ContentStatus } from "@/types";
import { FileText, Wand2, Download, Upload, Eye, Save, Image, Video, Music, FileCode } from "lucide-react";
import RichTextEditor from "@/components/common/RichTextEditor";
import ImageUpload from "@/components/common/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/db/supabase";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// 媒体统计接口
interface MediaStats {
  images: number;
  videos: number;
  audios: number;
  localizedImages: number;
  localizedVideos: number;
  localizedAudios: number;
}

export default function HTMLContentImporter() {
  const [htmlContent, setHtmlContent] = useState("");
  const [processedContent, setProcessedContent] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<ContentStatus>("draft");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoLocalizeImages, setAutoLocalizeImages] = useState(true);
  const [autoLocalizeVideos, setAutoLocalizeVideos] = useState(true);
  const [autoLocalizeAudios, setAutoLocalizeAudios] = useState(true);
  const [aiFormat, setAiFormat] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [previewMode, setPreviewMode] = useState<"rich" | "html">("html"); // 预览模式：富文本或HTML
  const [mediaStats, setMediaStats] = useState<MediaStats>({
    images: 0,
    videos: 0,
    audios: 0,
    localizedImages: 0,
    localizedVideos: 0,
    localizedAudios: 0
  });
  const { toast } = useToast();

  // 加载分类
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories("article");
        setCategories(data);
      } catch (error) {
        console.error("加载分类失败:", error);
      }
    };
    loadCategories();
  }, []);

  // 处理HTML内容
  const handleProcessHTML = async () => {
    if (!htmlContent.trim()) {
      toast({ title: "错误", description: "请输入HTML内容", variant: "destructive" });
      return;
    }

    setLoading(true);
    setProcessingProgress(0);
    setProcessingStatus("开始处理内容...");
    
    try {
      let processed = htmlContent;

      // 1. 分析媒体内容
      setProcessingStatus("分析媒体内容...");
      setProcessingProgress(10);
      const stats = analyzeMedia(processed);
      setMediaStats(stats);

      // 2. 自动提取标题（如果没有手动输入）
      setProcessingStatus("提取标题和摘要...");
      setProcessingProgress(20);
      if (!title) {
        const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
          const extractedTitle = h1Match[1].replace(/<[^>]+>/g, '').trim();
          setTitle(extractedTitle);
          // 自动生成slug
          setSlug(extractedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
      }

      // 3. 自动提取摘要（如果没有手动输入）
      if (!excerpt) {
        const firstPMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/i);
        if (firstPMatch) {
          const extractedExcerpt = firstPMatch[1]
            .replace(/<[^>]+>/g, '')
            .trim()
            .substring(0, 200);
          setExcerpt(extractedExcerpt);
        }
      }

      // 4. 自动本地化图片
      if (autoLocalizeImages && stats.images > 0) {
        setProcessingStatus(`正在本地化图片 (0/${stats.images})...`);
        setProcessingProgress(30);
        processed = await localizeImages(processed, (current, total) => {
          setProcessingStatus(`正在本地化图片 (${current}/${total})...`);
          setProcessingProgress(30 + (current / total) * 20);
        });
      }

      // 5. 自动本地化视频
      if (autoLocalizeVideos && stats.videos > 0) {
        setProcessingStatus(`正在本地化视频 (0/${stats.videos})...`);
        setProcessingProgress(50);
        processed = await localizeVideos(processed, (current, total) => {
          setProcessingStatus(`正在本地化视频 (${current}/${total})...`);
          setProcessingProgress(50 + (current / total) * 20);
        });
      }

      // 6. 自动本地化音频
      if (autoLocalizeAudios && stats.audios > 0) {
        setProcessingStatus(`正在本地化音频 (0/${stats.audios})...`);
        setProcessingProgress(70);
        processed = await localizeAudios(processed, (current, total) => {
          setProcessingStatus(`正在本地化音频 (${current}/${total})...`);
          setProcessingProgress(70 + (current / total) * 10);
        });
      }

      // 7. AI智能排版（如果启用）
      if (aiFormat) {
        setProcessingStatus("AI智能排版...");
        setProcessingProgress(85);
        processed = await aiFormatContent(processed);
      }

      // 8. 清理和优化HTML
      setProcessingStatus("清理和优化HTML...");
      setProcessingProgress(95);
      processed = cleanHTML(processed);

      setProcessedContent(processed);
      setProcessingProgress(100);
      setProcessingStatus("处理完成！");
      
      toast({ 
        title: "成功", 
        description: `内容处理完成！已本地化 ${mediaStats.localizedImages} 张图片、${mediaStats.localizedVideos} 个视频、${mediaStats.localizedAudios} 个音频` 
      });
    } catch (error) {
      console.error("处理内容失败:", error);
      toast({ title: "错误", description: "处理内容失败", variant: "destructive" });
      setProcessingStatus("处理失败");
    } finally {
      setLoading(false);
    }
  };

  // 分析媒体内容
  const analyzeMedia = (html: string): MediaStats => {
    const stats: MediaStats = {
      images: 0,
      videos: 0,
      audios: 0,
      localizedImages: 0,
      localizedVideos: 0,
      localizedAudios: 0
    };

    // 统计图片
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        stats.images++;
      }
    }

    // 统计视频
    const videoRegex = /<video[^>]*>[\s\S]*?<\/video>|<source[^>]+src="([^">]+)"[^>]*type="video/g;
    while ((match = videoRegex.exec(html)) !== null) {
      stats.videos++;
    }

    // 统计音频
    const audioRegex = /<audio[^>]*>[\s\S]*?<\/audio>|<source[^>]+src="([^">]+)"[^>]*type="audio/g;
    while ((match = audioRegex.exec(html)) !== null) {
      stats.audios++;
    }

    return stats;
  };

  // 本地化图片
  const localizeImages = async (html: string, onProgress?: (current: number, total: number) => void): Promise<string> => {
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    let match;
    const imageUrls: string[] = [];
    const imageMap = new Map<string, string>();

    // 提取所有图片URL
    while ((match = imgRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        imageUrls.push(url);
      }
    }

    if (imageUrls.length === 0) {
      return html;
    }

    let successCount = 0;

    // 下载并上传图片
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      try {
        if (onProgress) {
          onProgress(i + 1, imageUrls.length);
        }

        // 下载图片
        const response = await fetch(url);
        if (!response.ok) continue;

        const blob = await response.blob();
        
        // 检查文件大小（最大10MB）
        if (blob.size > 10 * 1024 * 1024) {
          console.warn('图片过大，跳过:', url);
          continue;
        }

        const fileName = `imported-img-${Date.now()}-${Math.random().toString(36).substring(7)}.${blob.type.split('/')[1] || 'jpg'}`;

        // 上传到Supabase Storage
        const { data, error } = await supabase.storage
          .from('app-7fshtpomqha9_cms_images')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '3600'
          });

        if (error) {
          console.error('上传图片失败:', error);
          continue;
        }

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('app-7fshtpomqha9_cms_images')
          .getPublicUrl(fileName);

        imageMap.set(url, publicUrl);
        successCount++;
      } catch (error) {
        console.error('处理图片失败:', url, error);
      }
    }

    // 替换HTML中的图片URL
    let result = html;
    imageMap.forEach((newUrl, oldUrl) => {
      result = result.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    });

    // 更新统计
    setMediaStats(prev => ({ ...prev, localizedImages: successCount }));

    return result;
  };

  // 本地化视频
  const localizeVideos = async (html: string, onProgress?: (current: number, total: number) => void): Promise<string> => {
    // 提取video标签中的source src
    const videoRegex = /<video[^>]*>([\s\S]*?)<\/video>/g;
    const sourceRegex = /<source[^>]+src="([^">]+)"[^>]*>/g;
    
    let match;
    const videoUrls: string[] = [];
    const videoMap = new Map<string, string>();

    // 提取所有视频URL
    while ((match = videoRegex.exec(html)) !== null) {
      const videoContent = match[1];
      let sourceMatch;
      while ((sourceMatch = sourceRegex.exec(videoContent)) !== null) {
        const url = sourceMatch[1];
        if (url.startsWith('http://') || url.startsWith('https://')) {
          videoUrls.push(url);
        }
      }
    }

    // 也检查直接的video src属性
    const directVideoRegex = /<video[^>]+src="([^">]+)"/g;
    while ((match = directVideoRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        videoUrls.push(url);
      }
    }

    if (videoUrls.length === 0) {
      return html;
    }

    let successCount = 0;

    // 下载并上传视频
    for (let i = 0; i < videoUrls.length; i++) {
      const url = videoUrls[i];
      try {
        if (onProgress) {
          onProgress(i + 1, videoUrls.length);
        }

        // 下载视频
        const response = await fetch(url);
        if (!response.ok) continue;

        const blob = await response.blob();
        
        // 检查文件大小（最大100MB）
        if (blob.size > 100 * 1024 * 1024) {
          console.warn('视频过大，跳过:', url);
          continue;
        }

        // 获取文件扩展名
        const contentType = blob.type;
        let ext = 'mp4';
        if (contentType.includes('webm')) ext = 'webm';
        else if (contentType.includes('ogg')) ext = 'ogg';
        else if (contentType.includes('mov')) ext = 'mov';

        const fileName = `imported-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // 上传到Supabase Storage
        const { data, error } = await supabase.storage
          .from('app-7fshtpomqha9_cms_videos')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '3600'
          });

        if (error) {
          console.error('上传视频失败:', error);
          continue;
        }

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('app-7fshtpomqha9_cms_videos')
          .getPublicUrl(fileName);

        videoMap.set(url, publicUrl);
        successCount++;
      } catch (error) {
        console.error('处理视频失败:', url, error);
      }
    }

    // 替换HTML中的视频URL
    let result = html;
    videoMap.forEach((newUrl, oldUrl) => {
      result = result.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    });

    // 更新统计
    setMediaStats(prev => ({ ...prev, localizedVideos: successCount }));

    return result;
  };

  // 本地化音频
  const localizeAudios = async (html: string, onProgress?: (current: number, total: number) => void): Promise<string> => {
    // 提取audio标签中的source src
    const audioRegex = /<audio[^>]*>([\s\S]*?)<\/audio>/g;
    const sourceRegex = /<source[^>]+src="([^">]+)"[^>]*>/g;
    
    let match;
    const audioUrls: string[] = [];
    const audioMap = new Map<string, string>();

    // 提取所有音频URL
    while ((match = audioRegex.exec(html)) !== null) {
      const audioContent = match[1];
      let sourceMatch;
      while ((sourceMatch = sourceRegex.exec(audioContent)) !== null) {
        const url = sourceMatch[1];
        if (url.startsWith('http://') || url.startsWith('https://')) {
          audioUrls.push(url);
        }
      }
    }

    // 也检查直接的audio src属性
    const directAudioRegex = /<audio[^>]+src="([^">]+)"/g;
    while ((match = directAudioRegex.exec(html)) !== null) {
      const url = match[1];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        audioUrls.push(url);
      }
    }

    if (audioUrls.length === 0) {
      return html;
    }

    let successCount = 0;

    // 下载并上传音频
    for (let i = 0; i < audioUrls.length; i++) {
      const url = audioUrls[i];
      try {
        if (onProgress) {
          onProgress(i + 1, audioUrls.length);
        }

        // 下载音频
        const response = await fetch(url);
        if (!response.ok) continue;

        const blob = await response.blob();
        
        // 检查文件大小（最大50MB）
        if (blob.size > 50 * 1024 * 1024) {
          console.warn('音频过大，跳过:', url);
          continue;
        }

        // 获取文件扩展名
        const contentType = blob.type;
        let ext = 'mp3';
        if (contentType.includes('wav')) ext = 'wav';
        else if (contentType.includes('ogg')) ext = 'ogg';
        else if (contentType.includes('aac')) ext = 'aac';
        else if (contentType.includes('flac')) ext = 'flac';

        const fileName = `imported-audio-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // 上传到Supabase Storage
        const { data, error } = await supabase.storage
          .from('app-7fshtpomqha9_cms_audios')
          .upload(fileName, blob, {
            contentType: blob.type,
            cacheControl: '3600'
          });

        if (error) {
          console.error('上传音频失败:', error);
          continue;
        }

        // 获取公共URL
        const { data: { publicUrl } } = supabase.storage
          .from('app-7fshtpomqha9_cms_audios')
          .getPublicUrl(fileName);

        audioMap.set(url, publicUrl);
        successCount++;
      } catch (error) {
        console.error('处理音频失败:', url, error);
      }
    }

    // 替换HTML中的音频URL
    let result = html;
    audioMap.forEach((newUrl, oldUrl) => {
      result = result.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    });

    // 更新统计
    setMediaStats(prev => ({ ...prev, localizedAudios: successCount }));

    return result;
  };

  // AI智能排版
  const aiFormatContent = async (html: string): Promise<string> => {
    // TODO: 集成AI服务进行智能排版
    // 这里可以调用AI API来优化内容格式
    
    // 临时实现：基本的格式优化
    let formatted = html;

    // 1. 统一段落间距
    formatted = formatted.replace(/<p>/g, '<p style="margin-bottom: 1em;">');

    // 2. 优化标题层级
    formatted = formatted.replace(/<h1>/g, '<h1 style="font-size: 2em; font-weight: bold; margin: 1em 0 0.5em;">');
    formatted = formatted.replace(/<h2>/g, '<h2 style="font-size: 1.5em; font-weight: bold; margin: 0.8em 0 0.4em;">');
    formatted = formatted.replace(/<h3>/g, '<h3 style="font-size: 1.2em; font-weight: bold; margin: 0.6em 0 0.3em;">');

    // 3. 优化列表样式
    formatted = formatted.replace(/<ul>/g, '<ul style="margin: 1em 0; padding-left: 2em;">');
    formatted = formatted.replace(/<ol>/g, '<ol style="margin: 1em 0; padding-left: 2em;">');
    formatted = formatted.replace(/<li>/g, '<li style="margin: 0.5em 0;">');

    // 4. 优化图片样式
    formatted = formatted.replace(/<img /g, '<img style="max-width: 100%; height: auto; display: block; margin: 1em auto;" ');

    // 5. 优化代码块
    formatted = formatted.replace(/<pre>/g, '<pre style="background: #f5f5f5; padding: 1em; border-radius: 4px; overflow-x: auto;">');
    formatted = formatted.replace(/<code>/g, '<code style="font-family: monospace; background: #f5f5f5; padding: 0.2em 0.4em; border-radius: 3px;">');

    return formatted;
  };

  // 清理HTML
  const cleanHTML = (html: string): string => {
    let cleaned = html;

    // 移除危险的标签和属性
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    cleaned = cleaned.replace(/on\w+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/on\w+='[^']*'/gi, '');

    // 移除多余的空白
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/>\s+</g, '><');

    return cleaned.trim();
  };

  // 发布文章
  const handlePublish = async () => {
    if (!title.trim()) {
      toast({ title: "错误", description: "请输入标题", variant: "destructive" });
      return;
    }

    if (!processedContent.trim()) {
      toast({ title: "错误", description: "请先处理内容", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast({ title: "错误", description: "请先登录", variant: "destructive" });
        return;
      }

      await createArticle({
        title,
        slug: slug || title.toLowerCase().replace(/\s+/g, '-'),
        content: processedContent,
        excerpt: excerpt || processedContent.replace(/<[^>]+>/g, '').substring(0, 200),
        cover_image: coverImage || undefined,
        category_id: categoryId || undefined,
        status,
        author_id: user.id
      });

      toast({ title: "成功", description: "文章已发布" });

      // 重置表单
      setHtmlContent("");
      setProcessedContent("");
      setTitle("");
      setSlug("");
      setExcerpt("");
      setCoverImage("");
      setCategoryId("");
      setStatus("draft");
    } catch (error) {
      console.error("发布文章失败:", error);
      toast({ title: "错误", description: "发布文章失败", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 从URL导入
  const handleImportFromURL = async (url: string) => {
    if (!url.trim()) {
      toast({ title: "错误", description: "请输入URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('获取页面失败');
      }

      const html = await response.text();
      setHtmlContent(html);
      toast({ title: "成功", description: "内容已导入" });
    } catch (error) {
      console.error("导入失败:", error);
      toast({ title: "错误", description: "导入失败，请检查URL", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // 处理粘贴事件（支持富文本和图片）
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    // 获取HTML内容
    const htmlData = clipboardData.getData('text/html');
    const textData = clipboardData.getData('text/plain');
    const files = Array.from(clipboardData.files);

    // 如果有HTML内容或文件，进行特殊处理
    if (htmlData || files.length > 0) {
      e.preventDefault(); // 阻止默认粘贴行为

      setLoading(true);
      toast({ title: "处理中", description: "正在提取多媒体内容..." });

      try {
        let processedHtml = htmlData || textData;
        const uploadedImages: { original: string; uploaded: string }[] = [];

        // 1. 处理剪贴板中的图片文件
        if (files.length > 0) {
          toast({ title: "上传中", description: `发现 ${files.length} 个文件，正在上传...` });

          for (const file of files) {
            if (file.type.startsWith('image/')) {
              try {
                // 生成文件名
                const fileExt = file.name.split('.').pop() || 'png';
                const fileName = `paste_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

                // 上传到Supabase
                const { data, error } = await supabase.storage
                  .from('app-7fshtpomqha9_cms_images')
                  .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                  });

                if (error) throw error;

                // 获取公开URL
                const { data: urlData } = supabase.storage
                  .from('app-7fshtpomqha9_cms_images')
                  .getPublicUrl(data.path);

                // 如果HTML中没有这个图片，添加到末尾
                if (!processedHtml.includes('img')) {
                  processedHtml += `\n<img src="${urlData.publicUrl}" alt="粘贴的图片" />`;
                }

                uploadedImages.push({
                  original: file.name,
                  uploaded: urlData.publicUrl
                });
              } catch (error) {
                console.error('上传图片失败:', error);
                toast({ 
                  title: "警告", 
                  description: `图片 ${file.name} 上传失败`,
                  variant: "destructive"
                });
              }
            }
          }
        }

        // 2. 处理HTML中的base64图片
        const base64ImgRegex = /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/gi;
        const base64Matches = Array.from(processedHtml.matchAll(base64ImgRegex));

        if (base64Matches.length > 0) {
          toast({ title: "处理中", description: `发现 ${base64Matches.length} 个内嵌图片，正在转换...` });

          for (const match of base64Matches) {
            try {
              const fullMatch = match[0];
              const imageType = match[1]; // png, jpeg, etc.
              const base64Data = match[2];

              // 将base64转换为Blob
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: `image/${imageType}` });

              // 生成文件名
              const fileName = `paste_base64_${Date.now()}_${Math.random().toString(36).substring(7)}.${imageType}`;

              // 上传到Supabase
              const { data, error } = await supabase.storage
                .from('app-7fshtpomqha9_cms_images')
                .upload(fileName, blob, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (error) throw error;

              // 获取公开URL
              const { data: urlData } = supabase.storage
                .from('app-7fshtpomqha9_cms_images')
                .getPublicUrl(data.path);

              // 替换HTML中的base64图片
              processedHtml = processedHtml.replace(fullMatch, fullMatch.replace(/src="data:image\/[^;]+;base64,[^"]+"/i, `src="${urlData.publicUrl}"`));

              uploadedImages.push({
                original: 'base64图片',
                uploaded: urlData.publicUrl
              });
            } catch (error) {
              console.error('处理base64图片失败:', error);
            }
          }
        }

        // 3. 设置处理后的HTML
        setHtmlContent(processedHtml);

        // 显示成功消息
        if (uploadedImages.length > 0) {
          toast({ 
            title: "成功", 
            description: `已成功上传 ${uploadedImages.length} 个图片并插入到内容中`
          });
        } else if (htmlData) {
          toast({ 
            title: "成功", 
            description: "HTML内容已粘贴"
          });
        }
      } catch (error) {
        console.error('粘贴处理失败:', error);
        toast({ 
          title: "错误", 
          description: "处理粘贴内容时出错，已使用原始内容",
          variant: "destructive"
        });
        // 如果处理失败，使用原始文本
        setHtmlContent(textData);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HTML内容导入器</h1>
          <p className="text-muted-foreground mt-2">
            导入HTML内容，自动本地化图片，AI智能排版，一键发布到文章模块
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 左侧：输入区域 */}
        <div className="space-y-6">
          {/* 导入选项 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                导入内容
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="paste">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste">粘贴HTML</TabsTrigger>
                  <TabsTrigger value="url">从URL导入</TabsTrigger>
                </TabsList>

                <TabsContent value="paste" className="space-y-4">
                  <div>
                    <Label htmlFor="html-content">HTML内容</Label>
                    <Textarea
                      id="html-content"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      onPaste={handlePaste}
                      placeholder="粘贴HTML内容...（支持直接粘贴富文本和图片）"
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 提示：可以直接从网页、Word等复制富文本内容粘贴，图片会自动上传并转换为URL
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="import-url">网页URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="import-url"
                        placeholder="https://example.com/article"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleImportFromURL((e.target as HTMLInputElement).value);
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          const input = document.getElementById('import-url') as HTMLInputElement;
                          handleImportFromURL(input.value);
                        }}
                        disabled={loading}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导入
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      输入网页URL，自动获取页面内容
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {/* 处理选项 */}
              <div className="space-y-3 pt-4 border-t">
                <Label>处理选项</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-localize-images"
                    checked={autoLocalizeImages}
                    onCheckedChange={(checked) => setAutoLocalizeImages(checked as boolean)}
                  />
                  <label
                    htmlFor="auto-localize-images"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    自动本地化图片
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-localize-videos"
                    checked={autoLocalizeVideos}
                    onCheckedChange={(checked) => setAutoLocalizeVideos(checked as boolean)}
                  />
                  <label
                    htmlFor="auto-localize-videos"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    自动本地化视频
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto-localize-audios"
                    checked={autoLocalizeAudios}
                    onCheckedChange={(checked) => setAutoLocalizeAudios(checked as boolean)}
                  />
                  <label
                    htmlFor="auto-localize-audios"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    自动本地化音频
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ai-format"
                    checked={aiFormat}
                    onCheckedChange={(checked) => setAiFormat(checked as boolean)}
                  />
                  <label
                    htmlFor="ai-format"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    AI智能排版
                  </label>
                </div>
              </div>

              {/* 媒体统计 */}
              {(mediaStats.images > 0 || mediaStats.videos > 0 || mediaStats.audios > 0) && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>媒体统计</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaStats.images > 0 && (
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Image className="w-5 h-5 mb-1 text-primary" />
                        <span className="text-xs text-muted-foreground">图片</span>
                        <Badge variant="secondary" className="mt-1">
                          {mediaStats.localizedImages}/{mediaStats.images}
                        </Badge>
                      </div>
                    )}
                    {mediaStats.videos > 0 && (
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Video className="w-5 h-5 mb-1 text-primary" />
                        <span className="text-xs text-muted-foreground">视频</span>
                        <Badge variant="secondary" className="mt-1">
                          {mediaStats.localizedVideos}/{mediaStats.videos}
                        </Badge>
                      </div>
                    )}
                    {mediaStats.audios > 0 && (
                      <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                        <Music className="w-5 h-5 mb-1 text-primary" />
                        <span className="text-xs text-muted-foreground">音频</span>
                        <Badge variant="secondary" className="mt-1">
                          {mediaStats.localizedAudios}/{mediaStats.audios}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 处理进度 */}
              {loading && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>处理进度</Label>
                    <span className="text-sm text-muted-foreground">{processingProgress}%</span>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">{processingStatus}</p>
                </div>
              )}

              <Button
                onClick={handleProcessHTML}
                disabled={loading || !htmlContent.trim()}
                className="w-full"
                size="lg"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                {loading ? "处理中..." : "处理内容"}
              </Button>
            </CardContent>
          </Card>

          {/* 文章信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                文章信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="文章标题"
                />
              </div>

              <div>
                <Label htmlFor="slug">URL别名</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-slug"
                />
              </div>

              <div>
                <Label htmlFor="excerpt">摘要</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="文章摘要..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="cover-image">封面图</Label>
                <ImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                />
              </div>

              <div>
                <Label htmlFor="category">分类</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无分类</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">状态</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ContentStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已发布</SelectItem>
                    <SelectItem value="archived">已归档</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handlePublish}
                disabled={loading || !processedContent.trim() || !title.trim()}
                className="w-full"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "发布中..." : "发布文章"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：预览区域 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  内容预览
                </CardTitle>
                {processedContent && (
                  <div className="flex gap-2">
                    <Button
                      variant={previewMode === "html" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("html")}
                    >
                      HTML预览
                    </Button>
                    <Button
                      variant={previewMode === "rich" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewMode("rich")}
                    >
                      富文本编辑
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {processedContent ? (
                <div className="space-y-4">
                  {previewMode === "html" ? (
                    <div className="border rounded-lg p-4 bg-background">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                        style={{
                          maxHeight: "600px",
                          overflowY: "auto"
                        }}
                      />
                      <style>{`
                        .prose video {
                          max-width: 100%;
                          height: auto;
                          margin: 1em 0;
                        }
                        .prose audio {
                          width: 100%;
                          margin: 1em 0;
                        }
                        .prose img {
                          max-width: 100%;
                          height: auto;
                          margin: 1em 0;
                        }
                      `}</style>
                    </div>
                  ) : (
                    <RichTextEditor
                      value={processedContent}
                      onChange={setProcessedContent}
                    />
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>处理内容后将在此显示预览</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
