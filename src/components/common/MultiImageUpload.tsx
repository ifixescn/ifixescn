import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/db/supabase";

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  className?: string;
}

export default function MultiImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  maxSizeMB = 1,
  className = ""
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFileName = (fileName: string): string => {
    const lastDotIndex = fileName.lastIndexOf(".");
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_]/g, "_");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${cleanName}_${timestamp}_${random}${extension}`;
  };

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: 0.8
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      if (compressedFile.size > maxSizeMB * 1024 * 1024) {
        const furtherCompressed = await imageCompression(file, {
          ...options,
          initialQuality: 0.6
        });
        return furtherCompressed;
      }
      
      return compressedFile;
    } catch (error) {
      console.error("Image compression failed:", error);
      throw error;
    }
  };

  const uploadSingleFile = async (file: File): Promise<string> => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      throw new Error(`文件 ${file.name} 格式不支持`);
    }

    let fileToUpload = file;

    // If file exceeds limit, compress it
    if (file.size > maxSizeMB * 1024 * 1024) {
      fileToUpload = await compressImage(file);
    }

    // Validate and clean file name
    const cleanFileName = validateFileName(fileToUpload.name);
    
    // Upload到 Supabase Storage
    const { data, error } = await supabase.storage
      .from("app-7fshtpomqha9_cms_images")
      .upload(cleanFileName, fileToUpload, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      throw error;
    }

    // 获取公开URL
    const { data: urlData } = supabase.storage
      .from("app-7fshtpomqha9_cms_images")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 检查YesNo超过最大Count
    const remainingSlots = maxImages - value.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Error",
        description: `最多只能上传 ${maxImages} 张图片`,
        variant: "destructive"
      });
      return;
    }

    // 限制UploadCount
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    const totalFiles = filesToUpload.length;

    if (files.length > remainingSlots) {
      toast({
        title: "Notice",
        description: `只能再上传 ${remainingSlots} 张图片，已自动选择前 ${remainingSlots} 张`
      });
    }

    setUploading(true);
    const uploadedUrls: string[] = [];
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = filesToUpload[i];
        setCurrentFile(file.name);
        setProgress(Math.round(((i + 0.5) / totalFiles) * 100));

        try {
          const url = await uploadSingleFile(file);
          uploadedUrls.push(url);
          successCount++;
        } catch (error) {
          console.error(`上传 ${file.name} 失败:`, error);
          failCount++;
        }

        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }

      // UpdateImage列表
      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }

      // Show结果
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Uploaded successfully",
          description: `成功上传 ${successCount} 张图片`
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "部分Success",
          description: `成功上传 ${successCount} 张，失败 ${failCount} 张`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Upload failed",
          description: "所有ImageUpload failed",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "未知Error",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
      setCurrentFile("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    // 模拟File选择事件
    const input = fileInputRef.current;
    if (input) {
      // Create一个新的 DataTransfer 对象
      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => {
        dataTransfer.items.add(file);
      });
      input.files = dataTransfer.files;
      
      // 触发 change 事件
      const event = new Event("change", { bubbles: true });
      input.dispatchEvent(event);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 上传区域 */}
      {value.length < maxImages && (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center transition-colors hover:border-primary"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            支持 JPEG、PNG、GIF、WEBP、AVIF Format
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            最大 {maxSizeMB} MB，超过将自动压缩
            <br />
            已上传 {value.length} / {maxImages} 张
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
            multiple
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "选择Image（可多选）"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            或拖拽Image到此区域
          </p>
        </div>
      )}

      {/* 上传进度 */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            正在上传: {currentFile}
            <br />
            进度: {progress}%
          </p>
        </div>
      )}

      {/* 图片预览网格 */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {value.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`图片 ${index + 1}`}
                className="w-full h-40 object-cover rounded-lg border"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <p className="text-sm text-center text-muted-foreground">
          还没有UploadImage
        </p>
      )}
    </div>
  );
}
