import { useState, useEffect, useRef } from "react";
import { Video as VideoIcon } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl?: string;
  coverImage?: string;
  title: string;
  className?: string;
}

/**
 * VideoThumbnail Component
 * Displays video cover image or extracts first frame from video as thumbnail
 */
export default function VideoThumbnail({
  videoUrl,
  coverImage,
  title,
  className = "",
}: VideoThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(coverImage || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // If cover image exists, use it
    if (coverImage) {
      setThumbnail(coverImage);
      return;
    }

    // If no cover image and video URL exists, extract first frame
    if (videoUrl && !coverImage) {
      extractFirstFrame();
    }
  }, [videoUrl, coverImage]);

  const extractFirstFrame = async () => {
    if (!videoUrl || loading) return;

    try {
      setLoading(true);
      setError(false);

      // Create video element
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      video.muted = true;

      // Wait for video to load
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => {
          // Seek to 1 second or start
          video.currentTime = Math.min(1, video.duration || 0);
        };

        video.onseeked = () => {
          try {
            // Create canvas to draw video frame
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas to data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            setThumbnail(dataUrl);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        video.onerror = () => {
          reject(new Error("Failed to load video"));
        };

        video.src = videoUrl;
      });
    } catch (err) {
      console.error("Failed to extract video thumbnail:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show thumbnail if available
  if (thumbnail && !error) {
    return (
      <img
        src={thumbnail}
        alt={title}
        className={`w-full h-full object-contain ${className}`}
        onError={() => setError(true)}
      />
    );
  }

  // Show fallback icon
  return (
    <div className={`w-full h-full flex items-center justify-center bg-muted ${className}`}>
      <VideoIcon className="h-12 w-12 xl:h-16 xl:w-16 text-muted-foreground" />
    </div>
  );
}
