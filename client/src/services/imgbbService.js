import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY;
const IMGBB_URL = 'https://api.imgbb.com/1/upload';
export const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;
export const MAX_IMAGE_UPLOAD_KB = 300;
const COMPRESSION_TIMEOUT_MS = 15_000;
const IMGBB_UPLOAD_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

const safeImageName = (value = 'image') => String(value)
  .trim()
  .replace(/\.[^/.]+$/, '')
  .replace(/[^a-z0-9-_]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'image';

const normalizeUploadArgs = (fileNameOrOptions, maybeOptions = {}) => {
  if (typeof fileNameOrOptions === 'string') {
    return { ...maybeOptions, fileName: fileNameOrOptions };
  }
  return { ...(fileNameOrOptions || {}) };
};

export const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const createCanceledError = (message = 'Upload canceled') => new Error(message);

const sleep = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(createCanceledError());
    return;
  }
  const timeoutId = window.setTimeout(resolve, ms);
  const abort = () => {
    window.clearTimeout(timeoutId);
    reject(createCanceledError());
  };
  signal?.addEventListener('abort', abort, { once: true });
});

const createUploadSignal = (signal, timeoutMs) => {
  const controller = new AbortController();
  const timeoutSignal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout
    ? AbortSignal.timeout(timeoutMs)
    : null;
  let timeoutId = null;

  const abort = () => {
    if (!controller.signal.aborted) controller.abort();
  };

  if (!timeoutSignal) timeoutId = window.setTimeout(abort, timeoutMs);
  timeoutSignal?.addEventListener('abort', abort, { once: true });
  signal?.addEventListener('abort', abort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutSignal?.removeEventListener('abort', abort);
      signal?.removeEventListener('abort', abort);
    }
  };
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    resolve(result.split(',')[1] || result);
  };
  reader.onerror = () => reject(new Error('Could not read image file'));
  reader.readAsDataURL(file);
});

const assertImgBBKey = () => {
  if (!IMGBB_API_KEY) {
    throw new Error('Missing VITE_IMGBB_API_KEY environment variable.');
  }
};

export const compressImageFile = async (file, { maxSizeKB = MAX_IMAGE_UPLOAD_KB, onProgress, signal } = {}) => {
  if (!file?.type?.startsWith('image/')) throw new Error('Please select a valid image file.');
  if (signal?.aborted) throw createCanceledError();

  const maxSizeMB = maxSizeKB / 1024;
  const compressionController = new AbortController();
  let compressionTimeoutId = null;
  const abortCompression = () => compressionController.abort();
  signal?.addEventListener('abort', abortCompression, { once: true });

  try {
    onProgress?.({ phase: 'compressing', progress: 10 });
    const compressionPromise = imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.7,
      alwaysKeepResolution: false,
      signal: compressionController.signal,
      onProgress: (progress) => {
        onProgress?.({
          phase: 'compressing',
          progress: Math.min(92, Math.max(10, Math.round(progress)))
        });
      }
    });
    const timeoutPromise = new Promise((_, reject) => {
      compressionTimeoutId = window.setTimeout(() => {
        compressionController.abort();
        reject(new Error('Compression timeout after 15s'));
      }, COMPRESSION_TIMEOUT_MS);
    });
    const compressed = await Promise.race([compressionPromise, timeoutPromise]);
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'image';
    const webpFile = new File([compressed], `${baseName}.webp`, {
      type: 'image/webp',
      lastModified: Date.now()
    });

    if (webpFile.size > maxSizeKB * 1024) {
      throw new Error('Image too large. Try a different image');
    }

    onProgress?.({ phase: 'compressing', progress: 100 });
    return {
      file: webpFile,
      originalSize: file.size,
      compressedSize: webpFile.size,
      format: 'WebP',
      originalName: file.name,
      name: webpFile.name,
      compressionWarning: ''
    };
  } catch (error) {
    if (signal?.aborted) throw createCanceledError();
    throw error;
  } finally {
    window.clearTimeout(compressionTimeoutId);
    signal?.removeEventListener('abort', abortCompression);
  }
};

export const uploadToImgBB = async (compressedFile, fileNameOrOptions, maybeOptions) => {
  const {
    fileName,
    onProgress,
    signal,
    timeoutMs = IMGBB_UPLOAD_TIMEOUT_MS
  } = normalizeUploadArgs(fileNameOrOptions, maybeOptions);

  assertImgBBKey();
  if (!compressedFile) throw new Error('Image file is required.');
  if (compressedFile.size > MAX_IMAGE_UPLOAD_BYTES) throw new Error('Image too large. Try a different image');
  if (signal?.aborted) throw createCanceledError();

  const base64 = await fileToBase64(compressedFile);
  const formData = new FormData();
  formData.append('image', base64);
  formData.append('name', safeImageName(fileName || compressedFile.name || 'image'));

  const uploadSignal = createUploadSignal(signal, timeoutMs);
  try {
    onProgress?.(15);
    const response = await fetch(`${IMGBB_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      signal: uploadSignal.signal
    });
    onProgress?.(80);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(`ImgBB upload failed: ${data?.error?.message || response.status}`);
    }
    if (!data.success) {
      throw new Error(`ImgBB upload failed: ${data?.error?.message || 'Unknown error'}`);
    }

    const payload = {
      url: data.data.url,
      imageUrl: data.data.url,
      displayUrl: data.data.display_url || data.data.url,
      thumbUrl: data.data.thumb?.url || '',
      deleteUrl: data.data.delete_url || '',
      size: data.data.size,
      id: data.data.id,
      imgbbId: data.data.id,
      storageProvider: 'imgbb'
    };
    onProgress?.(100);
    return payload;
  } catch (error) {
    if (signal?.aborted || uploadSignal.signal.aborted) {
      throw createCanceledError(error?.message?.includes('timeout') ? 'ImgBB upload timeout after 30s' : 'Upload canceled');
    }
    throw error;
  } finally {
    uploadSignal.cleanup();
  }
};

export const deleteFromImgBB = async (deleteUrl) => {
  if (!deleteUrl) return false;
  try {
    const response = await fetch(deleteUrl, { method: 'GET' });
    if (!response.ok) console.warn(`ImgBB delete returned HTTP ${response.status}`);
    return response.ok;
  } catch (error) {
    console.warn('ImgBB delete failed:', error);
    return false;
  }
};

export const uploadWithRetry = async (compressedFile, fileNameOrOptions, maxRetriesOrOptions = 3, maybeOptions = {}) => {
  let fileName = fileNameOrOptions;
  let maxRetries = maxRetriesOrOptions;
  let options = maybeOptions;

  if (typeof fileNameOrOptions === 'object' && fileNameOrOptions !== null) {
    options = fileNameOrOptions;
    fileName = options.fileName;
    maxRetries = options.maxRetries || 3;
  } else if (typeof maxRetriesOrOptions === 'object' && maxRetriesOrOptions !== null) {
    options = maxRetriesOrOptions;
    maxRetries = options.maxRetries || 3;
  }

  const attempts = Math.max(1, Number(maxRetries) || 3);
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (attempt > 1) options.onRetry?.(attempt, attempts, lastError);
      return await uploadToImgBB(compressedFile, fileName, options);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || options.signal?.aborted) break;
      await sleep(RETRY_DELAY_MS, options.signal);
    }
  }

  throw lastError || new Error('Upload failed after 3 attempts. Check internet and try again.');
};

export const uploadCompressedImageToImgBB = async (compressedFile, onProgress, options = {}) => uploadWithRetry(compressedFile, {
  ...options,
  onProgress
});

export const uploadCompressedImage = async (compressedFile, {
  folder = 'uploads-images',
  fileName,
  onProgress,
  onRetry,
  signal,
  maxRetries = 3
} = {}) => uploadWithRetry(compressedFile, fileName || `${safeImageName(folder)}-${safeImageName(compressedFile?.name || 'image')}`, maxRetries, {
  onProgress,
  onRetry,
  signal
});

export const uploadImageToImgBB = async (file, onProgress) => {
  const compressed = await compressImageFile(file, {
    onProgress: ({ progress }) => onProgress?.(progress)
  });
  const uploaded = await uploadCompressedImageToImgBB(compressed.file, (progress) => onProgress?.(progress));
  return { ...uploaded, compression: compressed };
};

export const uploadMultipleImages = async (files, onEachProgress) => {
  const results = [];
  for (let index = 0; index < files.length; index += 1) {
    const result = await uploadImageToImgBB(files[index], (progress) => onEachProgress?.(index, progress));
    results.push(result);
  }
  return results;
};
