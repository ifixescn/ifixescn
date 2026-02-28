import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import { supabase } from "@/db/supabase";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
  maxSizeMB = 1,
  className = ""
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFileName = (fileName: string): string => {
    // Remove file extension
    const lastDotIndex = fileName.lastIndexOf(".");
    const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
    const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : "";

    // Keep only English letters, numbers and underscores
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9_]/g, "_");
    
    // Generate timestamp
    const timestamp = Date.now();
    
    return `${cleanName}_${timestamp}${extension}`;
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
      
      // If still exceeds limit after compression, continue to reduce quality
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, GIF, WEBP, AVIF format images are supported",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      let fileToUpload = file;
      let wasCompressed = false;

      // If file exceeds limit, compress it
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "Notice",
          description: "Image超过Size限制，正在自动压缩..."
        });
        setProgress(30);
        fileToUpload = await compressImage(file);
        wasCompressed = true;
        setProgress(50);
      } else {
        setProgress(40);
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

      setProgress(80);

      if (error) {
        throw error;
      }

      // 获取公开URL
      const { data: urlData } = supabase.storage
        .from("app-7fshtpomqha9_cms_images")
        .getPublicUrl(data.path);

      setProgress(100);
      onChange(urlData.publicUrl);

      const finalSizeKB = (fileToUpload.size / 1024).toFixed(2);
      toast({
        title: "Uploaded successfully",
        description: wasCompressed 
          ? `图片已自动压缩并上传，最终大小: ${finalSizeKB} KB`
          : `图片上传成功，大小: ${finalSizeKB} KB`
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "未知Error",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange("");
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Upload的Image"
            className="w-full max-w-md h-auto rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">
            支持 JPEG、PNG、GIF、WEBP、AVIF Format
            <br />
            最大 {maxSizeMB} MB，超过将自动压缩
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "选择Image"}
          </Button>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            上传进度: {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
