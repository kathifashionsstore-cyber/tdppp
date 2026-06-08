import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '202b1fcbad15a90cccbd9e2a44bcb4fa';
const IMGBB_URL = 'https://api.imgbb.com/1/upload';
export const MAX_IMAGE_UPLOAD_BYTES = 300 * 1024;
export const MAX_IMAGE_UPLOAD_KB = 300;

export const formatFileSize = (bytes = 0) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

export const compressImageFile = async (file, { maxSizeKB = MAX_IMAGE_UPLOAD_KB, onProgress } = {}) => {
  if (!file?.type?.startsWith('image/')) throw new Error('Please select a valid image file.');

  const maxSizeMB = maxSizeKB / 1024;
  let quality = 0.82;
  let compressed = null;
  let pass = 0;

  while (pass < 6) {
    pass += 1;
    onProgress?.({ phase: 'compressing', pass, quality, progress: Math.min(92, pass * 14) });
    compressed = await imageCompression(file, {
      maxSizeMB,
      maxWidthOrHeight: 1920,
      initialQuality: quality,
      fileType: 'image/webp',
      useWebWorker: true,
      alwaysKeepResolution: false
    });
    if (compressed.size <= maxSizeKB * 1024) break;
    quality = Math.max(0.42, quality - 0.1);
  }

  if (compressed.size > maxSizeKB * 1024) {
    throw new Error(`Image too large after compression. Maximum allowed size is ${maxSizeKB}KB.`);
  }

  const safeName = file.name.replace(/\.[^/.]+$/, '.webp');
  const webpFile = new File([compressed], safeName, { type: compressed.type || 'image/webp', lastModified: Date.now() });
  return {
    file: webpFile,
    originalSize: file.size,
    compressedSize: webpFile.size,
    format: webpFile.type.includes('webp') ? 'WebP' : webpFile.type || 'Image',
    originalName: file.name,
    name: safeName
  };
};

export const uploadCompressedImageToImgBB = async (compressedFile, onProgress) => {
  if (compressedFile.size > MAX_IMAGE_UPLOAD_BYTES) {
    throw new Error('Image too large. Maximum allowed size is 300KB. Please compress before uploading.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(compressedFile);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64);
      formData.append('name', compressedFile.name.replace(/\.[^/.]+$/, ''));
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) resolve({
            url: response.data.url,
            displayUrl: response.data.display_url,
            deleteUrl: response.data.delete_url,
            id: response.data.id
          });
          else reject(new Error(response.error?.message || 'ImgBB upload failed'));
        } catch (error) {
          reject(error);
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.open('POST', IMGBB_URL);
      xhr.send(formData);
    };
    reader.onerror = () => reject(new Error('File read error'));
  });
};

export const uploadImageToImgBB = async (file, onProgress) => {
  const compressed = await compressImageFile(file, { onProgress });
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
