const TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export const translateText = async (text, target = 'te', source = 'en') => {
  const clean = stripHtml(text);
  if (!clean) return '';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3500);
  const params = new URLSearchParams({
    client: 'gtx',
    sl: source,
    tl: target,
    dt: 't',
    q: clean
  });
  try {
    const response = await fetch(`${TRANSLATE_ENDPOINT}?${params.toString()}`, { signal: controller.signal });
    if (!response.ok) throw new Error('Translation failed');
    const data = await response.json();
    return (data?.[0] || []).map((part) => part?.[0] || '').join('').trim();
  } finally {
    window.clearTimeout(timeout);
  }
};

export const translatePayloadFields = async (payload, fields = ['title', 'description', 'content', 'message', 'location', 'name', 'subtitle', 'ctaText', 'tag']) => {
  const next = { ...payload };
  await Promise.all(fields.map(async (field) => {
    const enKey = `${field}_en`;
    const teKey = `${field}_te`;
    if (!next[enKey]) return;
    if (next[teKey] && next[teKey] !== next[enKey]) return;
    try {
      next[teKey] = await translateText(next[enKey]);
    } catch {
      next[teKey] = next[enKey];
    }
  }));
  return next;
};
