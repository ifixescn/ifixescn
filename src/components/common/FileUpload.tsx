import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/db/supabase";
import { Upload, X, FileText, Loader2 } from "lucide-react";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUpload({
  value = "",
  onChange,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar",
  maxSizeMB = 10,
  label = "Upload Files"
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file name contains Chinese characters
    if (/[\u4e00-\u9fa5]/.test(file.name)) {
      toast({
        title: "Error",
        description: "File name cannot contain Chinese characters, please rename before uploading",
        variant: "destructive"
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "Error",
        description: `文件大小不能超过 ${maxSizeMB}MB`,
        variant: "destructive"
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `files/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(`${import.meta.env.VITE_APP_ID}_cms_files`)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(`${import.meta.env.VITE_APP_ID}_cms_files`)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast({
        title: "Success",
        description: "FileUploaded successfully"
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "FileUpload failed，Please try again",
        variant: "destructive"
      });
      setFileName("");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileNameFromUrl = (url: string) => {
    if (!url) return "";
    const parts = url.split("/");
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {!value ? (
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                  {fileName && (
                    <p className="text-xs text-muted-foreground">{fileName}</p>
                  )}
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">点击Upload Files</p>
                  <p className="text-xs text-muted-foreground">
                    支持的格式: {accept}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    最大文件大小: {maxSizeMB}MB
                  </p>
                  <p className="text-xs text-red-500">
                    注意：File Name不能包含中文字符
                  </p>
                </>
              )}
            </div>
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm font-medium">{getFileNameFromUrl(value)}</p>
                <a
                  href={value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  ViewFile
                </a>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
