/**
 * Browser-side video compression utility using FFmpeg.wasm (single-thread mode).
 * Both the JS wrapper and the WASM core are loaded from CDN on first use —
 * no npm bundling of @ffmpeg/* required, avoids Rollup/Vercel build errors.
 *
 * Target: compress video to ≤ TARGET_SIZE_MB while keeping the best possible quality.
 */

// CDN bases
const FFMPEG_ESM_CDN = 'https://esm.sh/@ffmpeg';
const FFMPEG_CORE_CDN = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

const TARGET_SIZE_MB = 50;
const TARGET_SIZE_BYTES = TARGET_SIZE_MB * 1024 * 1024;

// Singleton FFmpeg instance — only initialised once per page session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegLoading: Promise<any> | null = null;

export interface CompressionProgress {
  phase: 'loading' | 'compressing';
  /** 0–100 */
  percent: number;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

/**
 * Lazily load the FFmpeg WASM binary from CDN (≈ 32 MB, cached by the browser after the first load).
 * Both the JS wrapper and WASM core are fetched from CDN — no bundler involvement.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getFFmpeg(onProgress?: (p: CompressionProgress) => void): Promise<any> {
  if (ffmpegInstance) return ffmpegInstance;

  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      onProgress?.({ phase: 'loading', percent: 0 });

      // Dynamic CDN import — Rollup/Vite will not attempt to bundle this
      const { FFmpeg } = await import(/* @vite-ignore */ `${FFMPEG_ESM_CDN}/ffmpeg@0.12.10`);
      const { toBlobURL } = await import(/* @vite-ignore */ `${FFMPEG_ESM_CDN}/util@0.12.1`);

      const ff = new FFmpeg();

      // Stream core + wasm through blob URLs so the browser can cache them
      const [coreURL, wasmURL] = await Promise.all([
        toBlobURL(`${FFMPEG_CORE_CDN}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${FFMPEG_CORE_CDN}/ffmpeg-core.wasm`, 'application/wasm'),
      ]);

      onProgress?.({ phase: 'loading', percent: 60 });

      await ff.load({ coreURL, wasmURL });

      onProgress?.({ phase: 'loading', percent: 100 });
      ffmpegInstance = ff;
      return ff;
    })();
  }

  return ffmpegLoading;
}

/**
 * Extract the duration (seconds) of a video File using a temporary <video> element.
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || 60); // Fall back to 60 s if unknown
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(60);
    };
    video.src = url;
  });
}

/**
 * Calculate the target video bitrate (kbps) so the output fits within TARGET_SIZE_BYTES.
 * Reserves 10 % of the budget for the audio track.
 */
function calcTargetBitrate(durationSeconds: number): number {
  const totalBits = TARGET_SIZE_BYTES * 8;
  const audioBits = 128_000 * durationSeconds; // 128 kbps audio
  const videoBits = totalBits * 0.9 - audioBits;
  const videoBitrate = Math.max(200, Math.floor(videoBits / durationSeconds / 1000)); // kbps
  return videoBitrate;
}

/**
 * Compress a video File to ≤ TARGET_SIZE_MB (50 MB).
 * If the file is already small enough, it is returned unchanged.
 *
 * @param file       Original video File
 * @param onProgress Optional progress callback (0–100 %)
 */
export async function compressVideo(
  file: File,
  onProgress?: (p: CompressionProgress) => void
): Promise<CompressionResult> {
  // Skip compression if already within target
  if (file.size <= TARGET_SIZE_BYTES) {
    return { file, originalSize: file.size, compressedSize: file.size, wasCompressed: false };
  }

  const ff = await getFFmpeg(onProgress);

  // Wire up FFmpeg's own progress events → 0–100
  ff.on('progress', ({ progress }: { progress: number }) => {
    onProgress?.({ phase: 'compressing', percent: Math.round(Math.min(progress * 100, 99)) });
  });

  const ext = (file.name.split('.').pop() ?? 'mp4').toLowerCase();
  const inputName = `input.${ext}`;
  const outputName = 'output.mp4';

  // Dynamically import fetchFile from CDN (same as getFFmpeg approach)
  const { fetchFile } = await import(/* @vite-ignore */ `${FFMPEG_ESM_CDN}/util@0.12.1`);

  // Write source file into the WASM virtual FS
  await ff.writeFile(inputName, await fetchFile(file));

  // Determine an appropriate bitrate
  const duration = await getVideoDuration(file);
  const videoBitrate = calcTargetBitrate(duration);

  /**
   * Compression strategy (single pass, fast preset):
   *  - Scale to 720p max (keeps aspect ratio, -2 = divisible by 2)
   *  - H.264 with target bitrate
   *  - AAC audio at 128 kbps
   *  - Fast preset for reasonable speed in the browser
   */
  await ff.exec([
    '-i', inputName,
    '-vf', 'scale=-2:min(ih\\,720)',
    '-c:v', 'libx264',
    '-b:v', `${videoBitrate}k`,
    '-maxrate', `${Math.round(videoBitrate * 1.5)}k`,
    '-bufsize', `${videoBitrate * 2}k`,
    '-preset', 'fast',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-movflags', '+faststart',
    '-y',
    outputName,
  ]);

  // Read compressed file out of WASM virtual FS
  const data = await ff.readFile(outputName) as Uint8Array;
  // Copy into a fresh Uint8Array backed by a standard ArrayBuffer (avoids SharedArrayBuffer TS conflict)
  const copy = new Uint8Array(data.length);
  copy.set(data);
  const blob = new Blob([copy], { type: 'video/mp4' });

  // Clean up WASM virtual FS
  try { await ff.deleteFile(inputName); } catch { /* ignore */ }
  try { await ff.deleteFile(outputName); } catch { /* ignore */ }

  // Remove progress listener to avoid leaking across multiple compressions
  ff.off('progress', () => {});

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const compressedFile = new File([blob], `${baseName}_compressed.mp4`, { type: 'video/mp4' });

  onProgress?.({ phase: 'compressing', percent: 100 });

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    wasCompressed: true,
  };
}

/** Format bytes to a human-readable string (B / KB / MB / GB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
