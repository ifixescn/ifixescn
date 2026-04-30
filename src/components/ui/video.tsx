/**
 * Native HTML5 video player component
 *
 * Uses native <video> element instead of video-react to ensure proper
 * playback with audio across all environments: iOS Safari, WeChat browser,
 * Android Chrome, etc.
 *
 * Key features:
 * - playsInline: required for iOS/WeChat to avoid forced fullscreen
 * - x5-video-player-type: inline playback for WeChat/QQ X5 browser
 * - Multiple <source> tags: automatic format fallback
 * - onError callback: lets parent components handle playback failures
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

interface VideoProps {
  /** Video source URL */
  src: string;
  /** Poster/thumbnail image URL */
  poster?: string;
  /** Additional CSS class */
  className?: string;
  /** Auto-play on load (default false; mobile usually requires muted to work) */
  autoPlay?: boolean;
  /** Mute audio (default false) */
  muted?: boolean;
  /** Show controls (default true) */
  controls?: boolean;
  /** Aspect ratio (default '16:9') */
  aspectRatio?: string | 'auto' | '16:9' | '4:3';
  /** Callback invoked when playback fails */
  onError?: () => void;
}

export default function Video({
  src,
  poster,
  className = '',
  autoPlay = false,
  muted = false,
  controls = true,
  aspectRatio = '16:9',
  onError,
}: VideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [isError, setIsError] = useState(false);
  const [showPoster, setShowPoster] = useState(!!poster);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Infer primary MIME type from src URL
  const getMimeType = (url: string): string => {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    const map: Record<string, string> = {
      mp4: 'video/mp4', webm: 'video/webm', ogg: 'video/ogg',
      ogv: 'video/ogg', mov: 'video/quicktime', avi: 'video/x-msvideo',
      mkv: 'video/x-matroska', flv: 'video/x-flv', wmv: 'video/x-ms-wmv',
      m4v: 'video/x-m4v', ts: 'video/MP2T', '3gp': 'video/3gpp',
    };
    return ext && map[ext] ? map[ext] : 'video/mp4';
  };

  const paddingMap: Record<string, string> = {
    '16:9': '56.25%', '4:3': '75%', 'auto': '0',
  };
  const paddingBottom = paddingMap[aspectRatio] ?? '56.25%';

  const formatTime = (s: number) => {
    if (isNaN(s) || s < 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePlay = useCallback(async () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      if (v.paused) {
        setShowPoster(false);
        await v.play();
      } else {
        v.pause();
      }
    } catch (err) {
      console.warn('[Video] Playback failed:', err);
    }
  }, []);

  const handleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      // Prefer standard fullscreen API; fall back to webkitEnterFullscreen on iOS
      if (v.requestFullscreen) {
        v.requestFullscreen();
      } else if ((v as any).webkitEnterFullscreen) {
        (v as any).webkitEnterFullscreen();
      }
    }
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    v.currentTime = ratio * v.duration;
  }, []);

  const handleRetry = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setIsError(false);
    v.load();
    v.play().catch(() => {});
  }, []);

  // Auto-hide controls after 3 seconds of inactivity
  const resetHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  useEffect(() => {
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, []);

  useEffect(() => {
    setIsError(false);
    setIsPlaying(false);
    setShowPoster(!!poster);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [src, poster]);

  const mimeType = getMimeType(src);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-black rounded-lg ${className}`}
      style={{ paddingBottom: aspectRatio !== 'auto' ? paddingBottom : undefined }}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      custom-component="video"
    >
      <div className={aspectRatio !== 'auto' ? 'absolute inset-0' : 'relative w-full'}>
        {/* Native video element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={poster}
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline          /* Required for iOS Safari / WeChat */
          x-webkit-airplay="allow"
          /* WeChat/QQ X5 engine inline playback — prevents forced fullscreen hijack */
          {...({ 'x5-video-player-type': 'h5-page' } as any)}
          {...({ 'x5-video-player-fullscreen': 'false' } as any)}
          {...({ 'x5-playsinline': 'true' } as any)}
          webkit-playsinline="true"
          crossOrigin="anonymous"
          preload="metadata"
          onPlay={() => { setIsPlaying(true); setShowPoster(false); }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v) return;
            setCurrentTime(v.currentTime);
            setProgress(v.duration ? (v.currentTime / v.duration) * 100 : 0);
          }}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) setDuration(v.duration);
          }}
          onError={() => {
            setIsError(true);
            onError?.();
          }}
        >
          {/* Primary format */}
          <source src={src} type={mimeType} />
          {/* Fallback: append mp4 attempt if primary format is not mp4 */}
          {mimeType !== 'video/mp4' && <source src={src} type="video/mp4" />}
          {/* Fallback: webm */}
          {mimeType !== 'video/webm' && <source src={src} type="video/webm" />}
          Your browser does not support video playback. Please upgrade your browser and try again.
        </video>

        {/* Poster layer (shown before playback starts) */}
        {showPoster && poster && (
          <div
            className="absolute inset-0 bg-black cursor-pointer"
            onClick={handlePlay}
          >
            <img
              src={poster}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors">
                <Play className="h-7 w-7 text-black ml-1" />
              </div>
            </div>
          </div>
        )}

        {/* Large play button when no poster is shown */}
        {!showPoster && !isPlaying && !isError && (
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={handlePlay}
          >
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors">
              <Play className="h-7 w-7 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Playback error overlay */}
        {isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4 p-6 text-center">
            <div className="text-white/80 text-sm space-y-1">
              <p className="font-semibold text-base text-white">Video failed to load</p>
              <p>Possible causes: network issue, unsupported format, or file has been deleted</p>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-full transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reload
            </button>
          </div>
        )}

        {/* Custom controls bar */}
        {controls && !isError && !showPoster && (
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pt-6 pb-2 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Progress bar */}
            <div
              className="h-1.5 bg-white/30 rounded-full mb-2 cursor-pointer relative group"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>

            {/* Button row */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="text-white hover:text-white/80 transition-colors p-1"
              >
                {isPlaying
                  ? <Pause className="h-5 w-5" />
                  : <Play className="h-5 w-5" />}
              </button>

              <button
                onClick={handleMute}
                className="text-white hover:text-white/80 transition-colors p-1"
              >
                {isMuted
                  ? <VolumeX className="h-5 w-5" />
                  : <Volume2 className="h-5 w-5" />}
              </button>

              <span className="text-white/80 text-xs flex-1">
                {formatTime(currentTime)}
                {duration > 0 && ` / ${formatTime(duration)}`}
              </span>

              <button
                onClick={handleFullscreen}
                className="text-white hover:text-white/80 transition-colors p-1"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Clickable overlay to toggle play/pause (excludes poster and error states) */}
        {controls && !showPoster && !isError && (
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ bottom: '60px' }}  /* Keep above controls bar */
            onClick={handlePlay}
          />
        )}
      </div>
    </div>
  );
}
