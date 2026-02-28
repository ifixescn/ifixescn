import { useMemo, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "@/db/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import imageCompression from "browser-image-compression";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  requireMemberForMedia?: boolean; // 是否要求会员才能上传图片和视频
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Please enter content...",
  className = "",
  requireMemberForMedia = false
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  // 检查用户是否有权限上传媒体文件
  const canUploadMedia = () => {
    if (!requireMemberForMedia) {
      return true; // 不需要会员权限
    }

    if (!profile) {
      toast({
        title: "Permission Denied",
        description: "Please login first",
        variant: "destructive"
      });
      return false;
    }

    // 检查是否是会员或更高等级（member, premium, svip, bronze, silver, gold）
    const memberLevels = ['member', 'premium', 'svip', 'bronze', 'silver', 'gold'];
    if (!memberLevels.includes(profile.member_level)) {
      toast({
        title: "Member Only Feature",
        description: "Only members can upload images and videos. Please upgrade to member.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // 图片上传处理
  const imageHandler = async () => {
    // 检查权限
    if (!canUploadMedia()) {
      return;
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/jpeg,image/png,image/gif,image/webp,image/avif");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // 验证文件类型
        const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Error",
            description: "Only JPEG, PNG, GIF, WEBP, AVIF format images are supported",
            variant: "destructive"
          });
          return;
        }

        let fileToUpload = file;

        // 如果文件超过1MB，进行压缩
        if (file.size > 1024 * 1024) {
          toast({
            title: "Notice",
            description: "Image is large, compressing..."
          });

          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            fileType: "image/webp",
            initialQuality: 0.8
          };

          fileToUpload = await imageCompression(file, options);
        }

        // 生成文件名
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.]/g, "_");
        const fileName = `editor_${timestamp}_${cleanName}`;

        // 上传到 Supabase Storage
        const { data, error } = await supabase.storage
          .from("app-7fshtpomqha9_cms_images")
          .upload(fileName, fileToUpload, {
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

        // 插入图片到编辑器
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", urlData.publicUrl);
          quill.setSelection(range.index + 1, 0);
        }

        toast({
          title: "Success",
          description: "Image uploaded successfully"
        });
      } catch (error) {
        console.error("图片上传失败:", error);
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    };
  };

  // 视频上传处理
  const videoHandler = async () => {
    // 检查权限
    if (!canUploadMedia()) {
      return;
    }

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "video/mp4,video/webm,video/ogg");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        // 验证文件类型
        const validTypes = ["video/mp4", "video/webm", "video/ogg"];
        if (!validTypes.includes(file.type)) {
          toast({
            title: "Error",
            description: "Only MP4, WebM, OGG format videos are supported",
            variant: "destructive"
          });
          return;
        }

        // 验证文件大小（限制50MB）
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
          toast({
            title: "Error",
            description: "Video file size cannot exceed 50MB",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Notice",
          description: "Uploading video, please wait..."
        });

        // 生成文件名
        const timestamp = Date.now();
        const cleanName = file.name.replace(/[^a-zA-Z0-9_.]/g, "_");
        const fileName = `video_${timestamp}_${cleanName}`;

        // 上传到 Supabase Storage
        const { data, error } = await supabase.storage
          .from("app-7fshtpomqha9_cms_videos")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false
          });

        if (error) {
          throw error;
        }

        // 获取公开URL
        const { data: urlData } = supabase.storage
          .from("app-7fshtpomqha9_cms_videos")
          .getPublicUrl(data.path);

        // 插入视频到编辑器
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "video", urlData.publicUrl);
          quill.setSelection(range.index + 1, 0);
        }

        toast({
          title: "Success",
          description: "Video uploaded successfully"
        });
      } catch (error) {
        console.error("视频上传失败:", error);
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ font: [] }],
          [{ size: ["small", false, "large", "huge"] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ script: "sub" }, { script: "super" }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ direction: "rtl" }],
          [{ align: [] }],
          ["blockquote", "code-block"],
          ["link", "image", "video"],
          ["clean"]
        ],
        handlers: {
          image: imageHandler,
          video: videoHandler
        }
      },
      clipboard: {
        matchVisual: false
      }
    }),
    [profile, requireMemberForMedia]
  );

  const formats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "direction",
    "align",
    "blockquote",
    "code-block",
    "link",
    "image",
    "video"
  ];

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
      />
      {requireMemberForMedia && (
        <p className="text-xs text-muted-foreground mt-2">
          💡 Member Feature: Image and video upload is available for members only.
        </p>
      )}
    </div>
  );
}
