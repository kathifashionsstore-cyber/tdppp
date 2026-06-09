import { useEffect, useState } from 'react';
import { getFirstImageCandidate, isViewableImageUrl, resolveImageSource } from '@/utils/imageSources';

export const useResolvedImage = (...candidates) => {
  const raw = getFirstImageCandidate(...candidates);
  const [src, setSrc] = useState(() => isViewableImageUrl(raw) ? raw : '');
  const [isResolving, setIsResolving] = useState(Boolean(raw) && !isViewableImageUrl(raw));

  useEffect(() => {
    let cancelled = false;

    if (!raw) {
      setSrc('');
      setIsResolving(false);
      return undefined;
    }

    if (isViewableImageUrl(raw)) {
      setSrc(raw);
      setIsResolving(false);
      return undefined;
    }

    setSrc('');
    setIsResolving(true);
    resolveImageSource(raw)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc('');
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [raw]);

  return { raw, src, isResolving };
};

export default useResolvedImage;
