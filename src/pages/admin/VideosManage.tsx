import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Video as VideoIcon, 
  Eye, 
  Upload, 
  X, 
  Play, 
  Search,
  Filter,
  Download,
  FileVideo,
  Clock,
  Calendar,
  HardDrive,
  TrendingUp,
  CheckSquare,
  Square,
  ArrowUpDown,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import {
  getAllVideosForAdmin,
  createVideo,
  updateVideo,
  deleteVideo,
  uploadVideoFile,
  uploadVideoCover,
  deleteVideoFile,
  deleteVideoCover,
  getCategories,
} from "@/db/api";
import type { Video, Category } from "@/types";

// 上传进度接口
interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function VideosManage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { toast } = useToast();
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category_id: "",
    video_url: "",
    cover_image: "",
    duration: 0,
    is_published: false,
    seo_title: "",
    seo_description: "",
    seo_keywords: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  // 搜索和筛选效果
  useEffect(() => {
    let result = [...videos];

    // 搜索
    if (searchQuery) {
      result = result.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 分类筛选
    if (filterCategory && filterCategory !== "all") {
      result = result.filter(video => video.category_id === filterCategory);
    }

    // 状态筛选
    if (filterStatus !== "all") {
      result = result.filter(video => 
        filterStatus === "published" ? video.is_published : !video.is_published
      );
    }

    // 排序
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Video];
      let bValue: any = b[sortBy as keyof Video];

      if (sortBy === "created_at") {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVideos(result);
  }, [videos, searchQuery, filterCategory, filterStatus, sortBy, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [videosData, categoriesData] = await Promise.all([
        getAllVideosForAdmin(),
        getCategories("video"),
      ]);
      setVideos(videosData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("加载数据失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载视频列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 拖拽上传处理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleVideoFile(files[0]);
    }
  };

  // 从视频提取时长
  const extractVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(Math.floor(video.duration));
      };

      video.onerror = () => {
        resolve(0);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  // 从视频生成封面
  const generateVideoCover = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // 获取第1秒的帧
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('无法生成封面'));
            }
          }, 'image/jpeg', 0.8);
        }
      };

      video.onerror = () => {
        reject(new Error('无法加载视频'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // 处理视频文件
  const handleVideoFile = async (file: File) => {
    // 验证文件类型
    if (!file.type.startsWith('video/')) {
      toast({
        title: "文件类型错误",
        description: "请上传视频文件",
        variant: "destructive",
      });
      return;
    }

    // 检查文件大小 (50GB - Supabase PRO 版限制)
    // PRO 版支持最大 50GB 单文件上传
    if (file.size > 50 * 1024 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "视频文件大小不能超过 50GB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      });

      // 提取视频时长
      const duration = await extractVideoDuration(file);
      
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.progress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, progress: prev.progress + 10 };
        });
      }, 300);

      // 上传视频
      const url = await uploadVideoFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress({
        fileName: file.name,
        progress: 100,
        status: 'success'
      });

      setFormData(prev => ({
        ...prev,
        video_url: url,
        duration: duration,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""), // 如果没有标题，使用文件名
      }));

      // 尝试自动生成封面
      if (!formData.cover_image) {
        try {
          const coverBlob = await generateVideoCover(file);
          const coverFile = new File([coverBlob], `cover_${file.name}.jpg`, { type: 'image/jpeg' });
          const coverUrl = await uploadVideoCover(coverFile);
          setFormData(prev => ({
            ...prev,
            cover_image: coverUrl,
          }));
          toast({
            title: "封面已自动生成",
            description: "已从视频中提取封面图",
          });
        } catch (error) {
          console.error("生成封面失败:", error);
          // 封面生成失败不影响视频上传
        }
      }

      toast({
        title: "上传成功",
        description: `视频已上传，时长: ${formatDuration(duration)}`,
      });

      setTimeout(() => {
        setUploadProgress(null);
      }, 2000);

    } catch (error: any) {
      console.error("上传失败:", error);
      const errorMessage = error?.message || error?.error?.message || '上传失败，请重试';
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      toast({
        title: "上传失败",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleVideoUpload 被调用');
    const file = e.target.files?.[0];
    console.log('选择的文件:', file ? { name: file.name, size: file.size, type: file.type } : '无文件');
    if (!file) return;
    handleVideoFile(file);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "文件过大",
        description: "封面图片大小不能超过 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      const url = await uploadVideoCover(file);
      setFormData({
        ...formData,
        cover_image: url,
      });
      toast({
        title: "上传成功",
        description: "封面图片已上传",
      });
    } catch (error) {
      console.error("上传失败:", error);
      toast({
        title: "上传失败",
        description: "封面上传失败，请重试",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url) {
      toast({
        title: "验证失败",
        description: "请填写标题并上传视频",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, formData);
        toast({
          title: "更新成功",
          description: "视频已更新",
        });
      } else {
        await createVideo(formData);
        toast({
          title: "创建成功",
          description: "视频已创建",
        });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (video: Video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || "",
      content: video.content || "",
      category_id: video.category_id || "",
      video_url: video.video_url,
      cover_image: video.cover_image || "",
      duration: video.duration || 0,
      is_published: video.is_published,
      seo_title: video.seo_title || "",
      seo_description: video.seo_description || "",
      seo_keywords: video.seo_keywords || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (video: Video) => {
    if (!confirm("确定要删除这个视频吗？")) return;

    try {
      // 删除视频文件
      if (video.video_url) {
        await deleteVideoFile(video.video_url);
      }
      // 删除封面
      if (video.cover_image) {
        await deleteVideoCover(video.cover_image);
      }
      // 删除记录
      await deleteVideo(video.id);
      toast({
        title: "删除成功",
        description: "视频已删除",
      });
      loadData();
    } catch (error) {
      console.error("删除失败:", error);
      toast({
        title: "删除失败",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedVideos.size === 0) {
      toast({
        title: "请选择视频",
        description: "请至少选择一个视频进行删除",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedVideos.size} 个视频吗？`)) return;

    try {
      const deletePromises = Array.from(selectedVideos).map(async (videoId) => {
        const video = videos.find(v => v.id === videoId);
        if (video) {
          if (video.video_url) await deleteVideoFile(video.video_url);
          if (video.cover_image) await deleteVideoCover(video.cover_image);
          await deleteVideo(video.id);
        }
      });

      await Promise.all(deletePromises);
      
      toast({
        title: "批量删除成功",
        description: `已删除 ${selectedVideos.size} 个视频`,
      });
      
      setSelectedVideos(new Set());
      loadData();
    } catch (error) {
      console.error("批量删除失败:", error);
      toast({
        title: "批量删除失败",
        description: "部分视频删除失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 批量发布/下架
  const handleBatchPublish = async (publish: boolean) => {
    if (selectedVideos.size === 0) {
      toast({
        title: "请选择视频",
        description: "请至少选择一个视频",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatePromises = Array.from(selectedVideos).map(async (videoId) => {
        await updateVideo(videoId, { is_published: publish });
      });

      await Promise.all(updatePromises);
      
      toast({
        title: publish ? "批量发布成功" : "批量下架成功",
        description: `已${publish ? '发布' : '下架'} ${selectedVideos.size} 个视频`,
      });
      
      setSelectedVideos(new Set());
      loadData();
    } catch (error) {
      console.error("批量操作失败:", error);
      toast({
        title: "批量操作失败",
        description: "部分视频操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  };

  // 单选
  const handleSelectVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  // 预览视频
  const handlePreview = (video: Video) => {
    setPreviewVideo(video);
    setPreviewDialogOpen(true);
  };

  const resetForm = () => {
    setEditingVideo(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      category_id: "",
      video_url: "",
      cover_image: "",
      duration: 0,
      is_published: false,
      seo_title: "",
      seo_description: "",
      seo_keywords: "",
    });
    setUploadProgress(null);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 统计数据
  const stats = {
    total: videos.length,
    published: videos.filter(v => v.is_published).length,
    draft: videos.filter(v => !v.is_published).length,
    totalViews: videos.reduce((sum, v) => sum + (v.view_count || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">加载中...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">视频总数</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有视频数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">已发布</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">
              已发布的视频
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">草稿</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">
              未发布的视频
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总浏览量</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              所有视频浏览量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主内容卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>视频管理</CardTitle>
            <CardDescription>管理您的视频内容</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加视频
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "编辑视频" : "添加视频"}</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="seo">SEO 设置</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* 视频上传区域 */}
                  <div>
                    <Label>视频文件 *</Label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mt-2 ${
                        dragActive ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        拖拽视频文件到这里，或点击选择文件
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        支持 MP4, MOV, AVI, MKV, WebM 等格式，最大 50GB
                      </p>
                      <p className="text-xs text-success/70 mb-4">
                        ✅ PRO 版已激活 - 支持超大文件上传
                      </p>
                      <Input
                        ref={videoInputRef}
                        type="file"
                        onChange={handleVideoUpload}
                        accept="video/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log('选择视频按钮被点击');
                          console.log('videoInputRef.current:', videoInputRef.current);
                          videoInputRef.current?.click();
                        }}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            上传中...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            选择视频文件
                          </>
                        )}
                      </Button>
                    </div>

                    {/* 上传进度 */}
                    {uploadProgress && (
                      <div className="mt-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{uploadProgress.fileName}</span>
                          <span className="text-sm text-muted-foreground">
                            {uploadProgress.progress}%
                          </span>
                        </div>
                        <Progress value={uploadProgress.progress} className="h-2" />
                        {uploadProgress.status === 'success' && (
                          <p className="text-sm text-green-600 mt-2 flex items-center">
                            <CheckSquare className="h-4 w-4 mr-1" />
                            上传成功
                          </p>
                        )}
                        {uploadProgress.status === 'error' && (
                          <p className="text-sm text-destructive mt-2 flex items-center">
                            <X className="h-4 w-4 mr-1" />
                            {uploadProgress.error}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.video_url && !uploadProgress && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        视频已上传
                      </div>
                    )}
                  </div>

                  {/* 标题 */}
                  <div>
                    <Label htmlFor="title">标题 *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="输入视频标题"
                    />
                  </div>

                  {/* 分类 */}
                  <div>
                    <Label htmlFor="category">分类</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
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

                  {/* 简介 */}
                  <div>
                    <Label htmlFor="description">简介</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="输入视频简介"
                      rows={3}
                    />
                  </div>

                  {/* 封面图片 */}
                  <div>
                    <Label htmlFor="cover">封面图片</Label>
                    <div className="mt-2">
                      <Input
                        ref={coverInputRef}
                        type="file"
                        onChange={handleCoverUpload}
                        disabled={uploading}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {formData.cover_image ? '更换封面' : '上传封面'}
                      </Button>
                      {formData.cover_image && (
                        <div className="mt-2 relative">
                          <img
                            src={formData.cover_image}
                            alt="封面预览"
                            className="w-full h-40 object-cover rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setFormData({ ...formData, cover_image: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      如果不上传，系统会自动从视频中提取封面
                    </p>
                  </div>

                  {/* 时长 */}
                  <div>
                    <Label htmlFor="duration">时长（秒）</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      placeholder="视频时长"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      上传视频时会自动提取时长
                    </p>
                  </div>

                  {/* 发布状态 */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="is_published">立即发布</Label>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="seo_title">SEO 标题</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="输入 SEO 标题"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      如果不填写，将使用视频标题
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO 描述</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="输入 SEO 描述"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      建议 150-160 个字符
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords">SEO 关键词</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                      placeholder="输入关键词，用逗号分隔"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      例如：手机维修, iPhone, 屏幕更换
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {editingVideo ? "更新" : "创建"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 搜索和筛选工具栏 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索视频标题或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="筛选分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">创建时间</SelectItem>
                <SelectItem value="view_count">浏览量</SelectItem>
                <SelectItem value="title">标题</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* 批量操作工具栏 */}
          {selectedVideos.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                已选择 {selectedVideos.size} 个视频
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(true)}>
                批量发布
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(false)}>
                批量下架
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                批量删除
              </Button>
            </div>
          )}

          {/* 视频列表 */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterCategory !== "all" || filterStatus !== "all" 
                ? "没有找到匹配的视频" 
                : "还没有视频，点击上方按钮添加"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedVideos.size === filteredVideos.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>封面</TableHead>
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>浏览量</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVideos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedVideos.has(video.id)}
                        onCheckedChange={() => handleSelectVideo(video.id)}
                      />
                    </TableCell>
                    <TableCell>
                      {video.cover_image ? (
                        <img
                          src={video.cover_image}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => handlePreview(video)}
                        />
                      ) : (
                        <div className="w-20 h-12 bg-muted rounded flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => handlePreview(video)}
                        >
                          <VideoIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {video.title}
                    </TableCell>
                    <TableCell>
                      {categories.find((c) => c.id === video.category_id)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(video.duration || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {video.view_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={video.is_published ? "default" : "secondary"}>
                        {video.is_published ? "已发布" : "草稿"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(video)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(video)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(video)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 视频预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewVideo?.title}</DialogTitle>
          </DialogHeader>
          {previewVideo && (
            <div className="space-y-4">
              <video
                ref={videoPreviewRef}
                src={previewVideo.video_url}
                controls
                className="w-full rounded-lg"
                poster={previewVideo.cover_image || undefined}
              />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">时长：</span>
                  {formatDuration(previewVideo.duration || 0)}
                </div>
                <div>
                  <span className="font-medium">浏览量：</span>
                  {previewVideo.view_count || 0}
                </div>
                <div>
                  <span className="font-medium">分类：</span>
                  {categories.find(c => c.id === previewVideo.category_id)?.name || '-'}
                </div>
                <div>
                  <span className="font-medium">状态：</span>
                  <Badge variant={previewVideo.is_published ? "default" : "secondary"} className="ml-2">
                    {previewVideo.is_published ? "已发布" : "草稿"}
                  </Badge>
                </div>
              </div>
              {previewVideo.description && (
                <div>
                  <p className="font-medium mb-2">描述：</p>
                  <p className="text-sm text-muted-foreground">{previewVideo.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
