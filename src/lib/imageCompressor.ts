/**
 * Client-side image compression & WebP conversion utility.
 * Compresses images before upload to reduce storage and bandwidth.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.80,
  format: 'webp',
};

const THUMBNAIL_OPTIONS: CompressOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.75,
  format: 'webp',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = DEFAULT_OPTIONS
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Skip if already small enough (< 100KB)
  if (file.size < 100 * 1024 && file.type === 'image/webp') {
    return file;
  }

  try {
    const img = await loadImage(file);
    const canvas = document.createElement('canvas');
    let { width, height } = img;

    // Scale down if needed
    if (width > opts.maxWidth! || height > opts.maxHeight!) {
      const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
    const ext = opts.format === 'webp' ? 'webp' : 'jpg';

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, opts.quality)
    );

    if (!blob) return file;

    // Only use compressed version if it's actually smaller
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, '');
    return new File([blob], `${baseName}.${ext}`, { type: mimeType });
  } catch {
    // If compression fails, return original
    return file;
  }
}

export async function generateThumbnail(file: File): Promise<File> {
  return compressImage(file, THUMBNAIL_OPTIONS);
}

export async function compressMultiple(
  files: File[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
