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
  Loader2,
  Zap
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
import { compressVideo, formatFileSize } from "@/utils/videoCompressor";

// Upload progress interface
interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'success' | 'error';
  error?: string;
  originalSize?: number;
  compressedSize?: number;
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

  // Search and filter effect
  useEffect(() => {
    let result = [...videos];

    // Search
    if (searchQuery) {
      result = result.filter(video =>
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (filterCategory && filterCategory !== "all") {
      result = result.filter(video => video.category_id === filterCategory);
    }

    // Filter by status
    if (filterStatus !== "all") {
      result = result.filter(video => 
        filterStatus === "published" ? video.is_published : !video.is_published
      );
    }

    // Sort
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
      console.error("Failed to load data:", error);
      toast({
        title: "Load failed",
        description: "Unable to load video list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Drag-and-drop upload handler
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

  // Extract duration from video file
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

  // Generate cover image from video file
  const generateVideoCover = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Capture frame at 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate cover'));
            }
          }, 'image/jpeg', 0.8);
        }
      };

      video.onerror = () => {
        reject(new Error('Unable to load video'));
      };

      video.src = URL.createObjectURL(file);
      video.load();
    });
  };

  // Handle video file upload logic
  const handleVideoFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    // Check file size — 5 GB limit (Supabase Pro plan)
    const MAX_VIDEO_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
    if (file.size > MAX_VIDEO_SIZE) {
      toast({
        title: "File too large",
        description: `Video file must not exceed 5 GB. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)} GB.`,
        variant: "destructive",
      });
      return;
    }

    // Soft warning for large files (> 500 MB) — upload will still proceed
    if (file.size > 500 * 1024 * 1024) {
      toast({
        title: "Large file detected",
        description: `Your file is ${(file.size / 1024 / 1024).toFixed(0)} MB. Upload may take several minutes depending on your connection speed.`,
      });
    }

    try {
      setUploading(true);

      // ── Compression phase ────────────────────────────────────────────────
      const TARGET_MB = 50;
      const needsCompression = file.size > TARGET_MB * 1024 * 1024;
      let fileToUpload = file;

      if (needsCompression) {
        toast({
          title: "Compressing video…",
          description: `File is ${formatFileSize(file.size)} — auto-compressing to ≤${TARGET_MB} MB`,
        });

        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: 'compressing',
        });

        const result = await compressVideo(file, ({ phase, percent }) => {
          setUploadProgress(prev => ({
            ...(prev ?? { fileName: file.name }),
            status: 'compressing',
            progress: phase === 'loading' ? Math.round(percent * 0.3) : Math.round(30 + percent * 0.6),
          }));
        });

        fileToUpload = result.file;

        if (result.wasCompressed) {
          toast({
            title: "Compression complete",
            description: `${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${Math.round((1 - result.compressedSize / result.originalSize) * 100)}% smaller)`,
          });
          setUploadProgress(prev => ({
            ...(prev ?? { fileName: file.name }),
            status: 'compressing',
            progress: 90,
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
          }));
        }
      } else {
        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        });
      }

      // ── Upload phase ─────────────────────────────────────────────────────
      setUploadProgress(prev => ({
        ...(prev ?? { fileName: file.name }),
        status: 'uploading',
        progress: needsCompression ? 90 : 0,
      }));

      // Extract video duration
      const duration = await extractVideoDuration(fileToUpload);

      // Simulate upload progress (90→99)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (!prev || prev.progress >= 99) {
            clearInterval(progressInterval);
            return prev;
          }
          const increment = needsCompression ? 2 : 10;
          return { ...prev, progress: Math.min(prev.progress + increment, 99) };
        });
      }, 300);

      const url = await uploadVideoFile(fileToUpload);

      clearInterval(progressInterval);
      setUploadProgress(prev => ({
        ...(prev ?? { fileName: file.name }),
        progress: 100,
        status: 'success',
      }));

      setFormData(prev => ({
        ...prev,
        video_url: url,
        duration: duration,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));

      // Attempt to auto-generate cover image from the (possibly compressed) file
      if (!formData.cover_image) {
        try {
          const coverBlob = await generateVideoCover(fileToUpload);
          const coverFile = new File([coverBlob], `cover_${file.name}.jpg`, { type: 'image/jpeg' });
          const coverUrl = await uploadVideoCover(coverFile);
          setFormData(prev => ({
            ...prev,
            cover_image: coverUrl,
          }));
          toast({
            title: "Cover generated",
            description: "Thumbnail extracted automatically from video",
          });
        } catch (error) {
          console.error("Failed to generate cover:", error);
          // Cover generation failure does not affect video upload
        }
      }

      toast({
        title: "Upload successful",
        description: `Video uploaded. Duration: ${formatDuration(duration)}`,
      });

      setTimeout(() => {
        setUploadProgress(null);
      }, 3000);

    } catch (error: any) {
      console.error("Upload failed:", error);
      // Surface the actual Supabase error message for easier diagnosis
      const errorMessage =
        error?.message ||
        error?.error?.message ||
        error?.error_description ||
        'Upload failed — please check file size and try again';
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: errorMessage
      });
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleVideoFile(file);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Cover image must not exceed 5 MB",
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
        title: "Upload successful",
        description: "Cover image uploaded",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "Cover upload failed, please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.video_url) {
      toast({
        title: "Validation failed",
        description: "Please enter a title and upload a video",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, formData);
        toast({
          title: "Updated",
          description: "Video has been updated",
        });
      } else {
        await createVideo(formData);
        toast({
          title: "Created",
          description: "Video has been created",
        });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save failed",
        description: "Operation failed, please try again",
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
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      // Delete video file
      if (video.video_url) {
        await deleteVideoFile(video.video_url);
      }
      // Delete cover image
      if (video.cover_image) {
        await deleteVideoCover(video.cover_image);
      }
      // Delete database record
      await deleteVideo(video.id);
      toast({
        title: "Deleted",
        description: "Video has been deleted",
      });
      loadData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete failed",
        description: "Operation failed, please try again",
        variant: "destructive",
      });
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedVideos.size === 0) {
      toast({
        title: "No videos selected",
        description: "Please select at least one video to delete",
        variant: "destructive",
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the selected ${selectedVideos.size} video(s)?`)) return;

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
        title: "Batch delete successful",
        description: `${selectedVideos.size} video(s) deleted`,
      });
      
      setSelectedVideos(new Set());
      loadData();
    } catch (error) {
      console.error("Batch delete failed:", error);
      toast({
        title: "Batch delete failed",
        description: "Some videos could not be deleted, please try again",
        variant: "destructive",
      });
    }
  };

  // Batch publish / unpublish
  const handleBatchPublish = async (publish: boolean) => {
    if (selectedVideos.size === 0) {
      toast({
        title: "No videos selected",
        description: "Please select at least one video",
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
        title: publish ? "Batch publish successful" : "Batch unpublish successful",
        description: `${selectedVideos.size} video(s) ${publish ? 'published' : 'unpublished'}`,
      });
      
      setSelectedVideos(new Set());
      loadData();
    } catch (error) {
      console.error("Batch operation failed:", error);
      toast({
        title: "Batch operation failed",
        description: "Some videos could not be updated, please try again",
        variant: "destructive",
      });
    }
  };

  // Select all / deselect all
  const handleSelectAll = () => {
    if (selectedVideos.size === filteredVideos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(filteredVideos.map(v => v.id)));
    }
  };

  // Toggle single selection
  const handleSelectVideo = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  // Preview video
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

  // Stats summary
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
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <FileVideo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Published videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpublished videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Views across all videos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main content card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Video Management</CardTitle>
            <CardDescription>Manage your video content</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingVideo ? "Edit Video" : "Add Video"}</DialogTitle>
              </DialogHeader>
              
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="seo">SEO Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Video upload area */}
                  <div>
                    <Label>Video File *</Label>
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
                        Drag a video file here, or click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Supports MP4, MOV, AVI, MKV, WebM and more · max 5 GB · files &gt;50 MB auto-compressed
                      </p>
                      <p className="text-xs text-primary/70 mb-4 flex items-center justify-center gap-1">
                        <Zap className="h-3 w-3" />
                        Videos larger than 50 MB will be automatically compressed in-browser before upload
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
                          videoInputRef.current?.click();
                        }}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {uploadProgress?.status === 'compressing' ? 'Compressing…' : 'Uploading…'}
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Select Video File
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Upload / compression progress */}
                    {uploadProgress && (
                      <div className="mt-4 p-4 border rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[60%]">{uploadProgress.fileName}</span>
                          <span className="text-sm text-muted-foreground shrink-0">{uploadProgress.progress}%</span>
                        </div>

                        {/* Phase label */}
                        {uploadProgress.status === 'compressing' && (
                          <p className="text-xs text-primary flex items-center gap-1">
                            <Zap className="h-3 w-3 animate-pulse" />
                            Compressing video with FFmpeg…
                          </p>
                        )}
                        {uploadProgress.status === 'uploading' && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading to cloud storage…
                          </p>
                        )}

                        <Progress value={uploadProgress.progress} className="h-2" />

                        {/* Size comparison after compression */}
                        {uploadProgress.originalSize && uploadProgress.compressedSize && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadProgress.originalSize)} → {formatFileSize(uploadProgress.compressedSize)}
                            {' '}
                            <span className="text-primary font-medium">
                              ({Math.round((1 - uploadProgress.compressedSize / uploadProgress.originalSize) * 100)}% smaller)
                            </span>
                          </p>
                        )}

                        {uploadProgress.status === 'success' && (
                          <p className="text-sm text-green-600 flex items-center gap-1">
                            <CheckSquare className="h-4 w-4" />
                            Upload successful
                          </p>
                        )}
                        {uploadProgress.status === 'error' && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <X className="h-4 w-4" />
                            {uploadProgress.error}
                          </p>
                        )}
                      </div>
                    )}

                    {formData.video_url && !uploadProgress && (
                      <div className="mt-2 text-sm text-green-600 flex items-center">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Video uploaded
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter video title"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter video description"
                      rows={3}
                    />
                  </div>

                  {/* Cover image */}
                  <div>
                    <Label htmlFor="cover">Cover Image</Label>
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
                        {formData.cover_image ? 'Replace cover' : 'Upload cover'}
                      </Button>
                      {formData.cover_image && (
                        <div className="mt-2 relative">
                          <img
                            src={formData.cover_image}
                            alt="Cover preview"
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
                      If not uploaded, a cover will be extracted automatically from the video
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <Label htmlFor="duration">Duration (seconds)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      placeholder="Video duration"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration is extracted automatically when a video is uploaded
                    </p>
                  </div>

                  {/* Publish status */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="is_published">Publish immediately</Label>
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder="Enter SEO title"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      If left blank, the video title will be used
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <Textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Enter SEO description"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Recommended 150–160 characters
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="seo_keywords">SEO Keywords</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => setFormData({ ...formData, seo_keywords: e.target.value })}
                      placeholder="Enter keywords, comma-separated"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: phone repair, iPhone, screen replacement
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={uploading}>
                  {editingVideo ? "Update" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and filter toolbar */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search video title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="view_count">View Count</SelectItem>
                <SelectItem value="title">Title</SelectItem>
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

          {/* Batch action toolbar */}
          {selectedVideos.size > 0 && (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedVideos.size} video(s) selected
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(true)}>
                Publish all
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBatchPublish(false)}>
                Unpublish all
              </Button>
              <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete all
              </Button>
            </div>
          )}

          {/* Video list */}
          {filteredVideos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery || filterCategory !== "all" || filterStatus !== "all" 
                ? "No videos match your search" 
                : "No videos yet — click the button above to add one"}
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
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                        {video.is_published ? "Published" : "Draft"}
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

      {/* Video preview dialog */}
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
                  <span className="font-medium">Duration: </span>
                  {formatDuration(previewVideo.duration || 0)}
                </div>
                <div>
                  <span className="font-medium">Views: </span>
                  {previewVideo.view_count || 0}
                </div>
                <div>
                  <span className="font-medium">Category: </span>
                  {categories.find(c => c.id === previewVideo.category_id)?.name || '-'}
                </div>
                <div>
                  <span className="font-medium">Status: </span>
                  <Badge variant={previewVideo.is_published ? "default" : "secondary"} className="ml-2">
                    {previewVideo.is_published ? "Published" : "Draft"}
                  </Badge>
                </div>
              </div>
              {previewVideo.description && (
                <div>
                  <p className="font-medium mb-2">Description:</p>
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
