import { supabase } from "@/db/supabase";

const BUCKET_NAME = "app-7fshtpomqha9_slides_images";
const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const COMPRESSION_QUALITY = 0.8;

/**
 * 压缩图片到指定大小
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // 计算缩放比例
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 转换为WEBP格式
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/webp",
          COMPRESSION_QUALITY
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
  });
}

/**
 * 验证文件名（只允许英文字母和数字）
 */
function sanitizeFilename(filename: string): string {
  const ext = filename.split(".").pop() || "webp";
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, "_");
  return `${sanitized}_${Date.now()}.${ext}`;
}

/**
 * 上传图片到Supabase Storage
 */
export async function uploadSlideImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  url: string;
  path: string;
  compressed: boolean;
  originalSize: number;
  finalSize: number;
}> {
  try {
    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, WEBP, and AVIF are allowed.");
    }

    // 验证文件名
    const sanitizedFilename = sanitizeFilename(file.name);
    if (!/^[a-zA-Z0-9_]+\.(jpg|jpeg|png|gif|webp|avif)$/i.test(sanitizedFilename)) {
      throw new Error("Filename must contain only English letters and numbers.");
    }

    const originalSize = file.size;
    let uploadFile: File | Blob = file;
    let compressed = false;

    // 如果文件大于1MB，自动压缩
    if (file.size > MAX_FILE_SIZE) {
      onProgress?.(10);
      uploadFile = await compressImage(file);
      compressed = true;
      onProgress?.(30);
    }

    const finalSize = uploadFile.size;

    // 如果压缩后仍然大于1MB，抛出错误
    if (finalSize > MAX_FILE_SIZE) {
      throw new Error(
        `File size is still too large after compression (${(finalSize / 1024 / 1024).toFixed(2)}MB). Please use a smaller image.`
      );
    }

    onProgress?.(50);

    // 上传到Supabase Storage
    const filePath = `slides/${sanitizedFilename}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, uploadFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    onProgress?.(80);

    // 获取公开URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

    onProgress?.(100);

    return {
      url: publicUrl,
      path: data.path,
      compressed,
      originalSize,
      finalSize,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

/**
 * 删除图片
 */
export async function deleteSlideImage(path: string): Promise<void> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
