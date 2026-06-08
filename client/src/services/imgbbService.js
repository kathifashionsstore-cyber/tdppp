import imageCompression from 'browser-image-compression';

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || '202b1fcbad15a90cccbd9e2a44bcb4fa';
const IMGBB_URL = 'https://api.imgbb.com/1/upload';

export const uploadImageToImgBB = async (file, onProgress) => {
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.29,
    maxWidthOrHeight: 1800,
    initialQuality: 0.86,
    fileType: 'image/webp',
    useWebWorker: true,
    alwaysKeepResolution: false
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(compressed);
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
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

export const uploadMultipleImages = async (files, onEachProgress) => {
  const results = [];
  for (let i = 0; i < files.length; i += 1) {
    const result = await uploadImageToImgBB(files[i], (progress) => onEachProgress?.(i, progress));
    results.push(result);
  }
  return results;
};
