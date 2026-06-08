import { useState } from 'react';
import { uploadImageToImgBB, uploadMultipleImages } from '@/services/imgbbService';

export const useImgBB = () => {
  const [progress, setProgress] = useState({});
  const [uploading, setUploading] = useState(false);
  const uploadOne = async (file) => {
    setUploading(true);
    try {
      return await uploadImageToImgBB(file, (value) => setProgress({ single: value }));
    } finally {
      setUploading(false);
    }
  };
  const uploadMany = async (files) => {
    setUploading(true);
    try {
      return await uploadMultipleImages(files, (index, value) => setProgress((state) => ({ ...state, [index]: value })));
    } finally {
      setUploading(false);
    }
  };
  return { uploadOne, uploadMany, uploading, progress };
};
