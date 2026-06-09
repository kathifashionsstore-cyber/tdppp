import imageCompression from 'browser-image-compression';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '202b1fcbad15a90cccbd9e2a44bcb4fa';
const IMGBB_URL = 'https://api.imgbb.com/1/upload';
export const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;
export const MAX_IMAGE_UPLOAD_KB = 300;
const COMPRESSION_TIMEOUT_MS = 15_000;
const FIREBASE_UPLOAD_TIMEOUT_MS = 30_000;
const IMGBB_UPLOAD_TIMEOUT_MS = 20_000;
const FALLBACK_UPLOAD_LIMIT_BYTES = 8 * 1024 * 1024;

const safeStorageSegment = (value = 'image') => String(value)
  .trim()
  .replace(/\.[^/.]+$/, '')
  .replace(/[^a-z0-9-_]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase() || 'image';

const safeStorageFolder = (folder = 'uploads/images') => String(folder)
  .split('/')
  .map(safeStorageSegment)
  .filter(Boolean)
  .join('/');

export const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const createCanceledError = (message = 'Upload canceled') => new Error(message);

const reportProgress = (onProgress, value) => {
  if (!onProgress) return;
  onProgress(value);
};

const withCancelableTimeout = (promise, { timeoutMs, message, signal }) => {
  if (signal?.aborted) return Promise.reject(createCanceledError());

  let timeoutId = null;
  let abortHandler = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  const cancel = new Promise((_, reject) => {
    abortHandler = () => reject(createCanceledError());
    signal?.addEventListener('abort', abortHandler, { once: true });
  });

  return Promise.race([promise, timeout, cancel]).finally(() => {
    clearTimeout(timeoutId);
    if (abortHandler) signal?.removeEventListener('abort', abortHandler);
  });
};

const toUploadFile = (blob, sourceFile, { fallback = false } = {}) => {
  if (fallback && sourceFile instanceof File) return sourceFile;

  const baseName = sourceFile.name.replace(/\.[^/.]+$/, '') || 'image';
  const safeName = fallback ? sourceFile.name : `${baseName}.webp`;
  return new File([blob], safeName, {
    type: blob.type || sourceFile.type || 'image/webp',
    lastModified: Date.now()
  });
};

const assertUploadableSize = (file) => {
  if (file.size > FALLBACK_UPLOAD_LIMIT_BYTES) {
    throw new Error(`Image is too large to upload (${formatFileSize(file.size)}). Please choose an image under ${formatFileSize(FALLBACK_UPLOAD_LIMIT_BYTES)}.`);
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
    reportProgress(onProgress, { phase: 'compressing', progress: 10 });
    const compressionPromise = imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.7,
      alwaysKeepResolution: false,
      signal: compressionController.signal,
      onProgress: (progress) => {
        reportProgress(onProgress, {
          phase: 'compressing',
          progress: Math.min(92, Math.max(10, Math.round(progress)))
        });
      }
    });
    const timeoutPromise = new Promise((_, reject) => {
      compressionTimeoutId = setTimeout(() => {
        compressionController.abort();
        reject(new Error('Compression timeout after 15s'));
      }, COMPRESSION_TIMEOUT_MS);
    });
    const compressed = await Promise.race([compressionPromise, timeoutPromise]);
    const webpFile = toUploadFile(compressed, file);
    const warning = webpFile.size > maxSizeKB * 1024
      ? `Compressed image is ${formatFileSize(webpFile.size)}, above the ${maxSizeKB}KB target.`
      : '';

    reportProgress(onProgress, { phase: 'compressing', progress: 95 });
    return {
      file: webpFile,
      originalSize: file.size,
      compressedSize: webpFile.size,
      format: webpFile.type.includes('webp') ? 'WebP' : webpFile.type || 'Image',
      originalName: file.name,
      name: webpFile.name,
      compressionWarning: warning
    };
  } catch (error) {
    if (signal?.aborted) throw createCanceledError();
    console.warn('Compression failed or timed out, using original image:', error.message);
    const originalFile = toUploadFile(file, file, { fallback: true });
    assertUploadableSize(originalFile);
    return {
      file: originalFile,
      originalSize: file.size,
      compressedSize: originalFile.size,
      format: originalFile.type || 'Image',
      originalName: file.name,
      name: originalFile.name,
      compressionWarning: 'Compression timed out, so the original image was uploaded.'
    };
  } finally {
    clearTimeout(compressionTimeoutId);
    signal?.removeEventListener('abort', abortCompression);
  }
};

export const uploadToImgBB = async (file, { onProgress, signal, timeoutMs = IMGBB_UPLOAD_TIMEOUT_MS } = {}) => {
  assertUploadableSize(file);
  if (signal?.aborted) throw createCanceledError();

  const controller = new AbortController();
  const abortUpload = () => controller.abort();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  signal?.addEventListener('abort', abortUpload, { once: true });

  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

  try {
    reportProgress(onProgress, 15);
    const response = await fetch(`${IMGBB_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    reportProgress(onProgress, 85);

    if (!response.ok) throw new Error(`ImgBB HTTP error: ${response.status}`);

    const data = await response.json();
    if (!data.success) throw new Error(data.error?.message || `ImgBB upload failed: ${JSON.stringify(data)}`);

    reportProgress(onProgress, 100);
    return {
      url: data.data.display_url || data.data.url,
      originalUrl: data.data.url,
      displayUrl: data.data.display_url,
      deleteUrl: data.data.delete_url,
      id: data.data.id,
      storageProvider: 'imgbb'
    };
  } catch (error) {
    if (signal?.aborted) throw createCanceledError();
    if (timedOut || error.name === 'AbortError') throw new Error('ImgBB upload timeout after 20s');
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortUpload);
  }
};

export const uploadCompressedImageToImgBB = async (compressedFile, onProgress, options = {}) => uploadToImgBB(compressedFile, {
  ...options,
  onProgress
});

export const uploadCompressedImageToFirebaseStorage = async (compressedFile, {
  folder = 'uploads/images',
  onProgress,
  signal,
  timeoutMs = FIREBASE_UPLOAD_TIMEOUT_MS
} = {}) => {
  assertUploadableSize(compressedFile);
  if (signal?.aborted) throw createCanceledError();
  const startedAt = Date.now();

  const cleanFolder = safeStorageFolder(folder);
  const cleanName = safeStorageSegment(compressedFile.name);
  const sourceExtension = compressedFile.name.match(/\.(jpe?g|png|webp)$/i)?.[1]?.toLowerCase();
  const extension = compressedFile.type?.includes('webp') ? 'webp' : sourceExtension || 'webp';
  const fullPath = `${cleanFolder}/${Date.now()}-${cleanName}.${extension}`;
  const targetRef = storageRef(storage, fullPath);

  const snapshot = await new Promise((resolve, reject) => {
    let settled = false;
    let uploadTask = null;
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', abortUpload);
      callback(value);
    };
    const abortUpload = () => {
      uploadTask?.cancel();
      finish(reject, createCanceledError());
    };
    const timeoutId = setTimeout(() => {
      uploadTask?.cancel();
      finish(reject, new Error('Upload timeout after 30s'));
    }, timeoutMs);

    signal?.addEventListener('abort', abortUpload, { once: true });
    uploadTask = uploadBytesResumable(targetRef, compressedFile, {
      contentType: compressedFile.type || 'image/webp',
      customMetadata: {
        originalName: compressedFile.name
      }
    });

    uploadTask.on(
      'state_changed',
      (state) => {
        if (state.totalBytes && onProgress) {
          onProgress(Math.round((state.bytesTransferred / state.totalBytes) * 100));
        }
      },
      (error) => finish(reject, error),
      () => finish(resolve, uploadTask.snapshot)
    );
  });

  const remainingTimeoutMs = timeoutMs - (Date.now() - startedAt);
  if (remainingTimeoutMs <= 0) throw new Error('Upload timeout after 30s');
  const downloadURL = await withCancelableTimeout(getDownloadURL(snapshot.ref), {
    timeoutMs: remainingTimeoutMs,
    message: 'Upload timeout after 30s',
    signal
  });
  return {
    url: downloadURL,
    downloadURL,
    path: snapshot.ref.fullPath,
    fullPath: snapshot.ref.fullPath,
    storageProvider: 'firebase'
  };
};

export const uploadCompressedImage = async (compressedFile, { folder, onProgress, signal, fallbackToImgBB = true } = {}) => {
  try {
    return await uploadCompressedImageToFirebaseStorage(compressedFile, { folder, onProgress, signal });
  } catch (error) {
    if (signal?.aborted) throw createCanceledError();
    if (!fallbackToImgBB) throw error;
    console.warn('Firebase upload failed, trying ImgBB fallback:', error.message);
    try {
      const fallback = await uploadCompressedImageToImgBB(compressedFile, onProgress, { signal });
      return {
        ...fallback,
        firebaseError: error.message || 'Firebase Storage upload failed'
      };
    } catch (fallbackError) {
      if (signal?.aborted) throw createCanceledError();
      throw new Error(`All upload methods failed. ${fallbackError.message || 'Check internet connection.'}`);
    }
  }
};

export const uploadImageToImgBB = async (file, onProgress) => {
  const compressed = await compressImageFile(file, {
    onProgress: ({ progress }) => onProgress?.(progress)
  });
  const uploaded = await uploadCompressedImageToImgBB(compressed.file, onProgress);
  return { ...uploaded, compression: compressed };
};

export const uploadMultipleImages = async (files, onEachProgress) => {
  const results = [];
  for (let i = 0; i < files.length; i += 1) {
    const result = await uploadImageToImgBB(files[i], (progress) => onEachProgress?.(i, progress));
    results.push(result);
  }
  return results;
};
