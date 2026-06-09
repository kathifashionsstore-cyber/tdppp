import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import { storage } from '@/services/firebase';

export const normalizeImageCandidate = (candidate) => {
  if (!candidate) return '';
  if (Array.isArray(candidate)) return getFirstImageCandidate(...candidate);
  if (typeof candidate === 'string') return candidate.trim();
  if (typeof candidate === 'object') {
    return normalizeImageCandidate(
      candidate.downloadURL
      || candidate.url
      || candidate.displayUrl
      || candidate.src
      || candidate.fullPath
      || candidate.path
    );
  }
  return '';
};

export const getFirstImageCandidate = (...candidates) => {
  for (const candidate of candidates) {
    const value = normalizeImageCandidate(candidate);
    if (value) return value;
  }
  return '';
};

export const isViewableImageUrl = (candidate) => {
  const value = normalizeImageCandidate(candidate);
  return /^(https?:|data:|blob:|\/)/i.test(value);
};

export const resolveImageSource = async (candidate) => {
  const value = normalizeImageCandidate(candidate);
  if (!value) return '';
  if (isViewableImageUrl(value)) return value;
  const downloadURL = await getDownloadURL(storageRef(storage, value));
  return downloadURL;
};
