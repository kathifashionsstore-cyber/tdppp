import DOMPurify from 'dompurify';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const getLangField = (doc = {}, field, language = 'te') => {
  if (!doc || typeof doc !== 'object') return '';
  const langField = `${field}_${language}`;
  return doc[langField] || doc[`${field}_te`] || doc[`${field}_en`] || doc[field] || '';
};

export const stripHtml = (html = '') => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export const sanitizeHtml = (html = '') => ({ __html: DOMPurify.sanitize(html) });

export const toDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  return new Date(value);
};

export const excerpt = (html = '', length = 150) => {
  const text = stripHtml(html);
  return text.length > length ? `${text.slice(0, length)}...` : text;
};

export const normalizeSearch = (value = '') => value.toString().toLowerCase().trim();

export const getYouTubeId = (url = '') => {
  const value = String(url || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] || '';
    if (host.endsWith('youtube.com')) {
      const fromQuery = parsed.searchParams.get('v');
      if (fromQuery) return fromQuery;
      const [, type, id] = parsed.pathname.split('/');
      if (['embed', 'shorts', 'live'].includes(type) && id) return id;
    }
  } catch {
    // Fall through to regex parsing for pasted IDs or partial URLs.
  }
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?.*v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/live\/([\w-]{11})/,
    /^([\w-]{11})$/
  ];
  return patterns.map((pattern) => value.match(pattern)?.[1]).find(Boolean) || '';
};

export const getYouTubeEmbedUrl = (url = '') => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : '';
};

export const getYouTubeThumbnailUrl = (url = '') => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
};
