export const toImgBBUploadMeta = (uploaded = {}) => {
  const imageUrl = uploaded.imageUrl || uploaded.url || uploaded.displayUrl || '';
  if (!imageUrl) return null;

  return {
    imageUrl,
    displayUrl: uploaded.displayUrl || imageUrl,
    thumbUrl: uploaded.thumbUrl || '',
    deleteUrl: uploaded.deleteUrl || '',
    imgbbId: uploaded.imgbbId || uploaded.id || '',
    sizeKB: Math.max(1, Math.round((Number(uploaded.size) || Number(uploaded.compressedSize) || 0) / 1024)),
    format: 'webp',
    createdAt: new Date().toISOString()
  };
};

export const toImgBBUploadMetaList = (uploaded) => (Array.isArray(uploaded) ? uploaded : [uploaded])
  .map(toImgBBUploadMeta)
  .filter(Boolean);
