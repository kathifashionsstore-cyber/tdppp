import { auth } from '@/services/firebase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

const getAuthHeaders = async () => {
  if (auth.currentUser) return { Authorization: `Bearer ${await auth.currentUser.getIdToken()}` };
  if (sessionStorage.getItem('tdp-admin-session') === 'local') return { 'x-local-admin': 'true' };
  return {};
};

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'PDF request failed');
  return data;
};

export const getPdfFileUrl = (pdf) => {
  if (!pdf) return '';
  if (pdf.fileUrl) return pdf.fileUrl;
  if (!pdf.filepath) return '';
  if (/^https?:\/\//i.test(pdf.filepath)) return pdf.filepath;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${pdf.filepath}`;
};

export const fetchPdfs = async ({ search = '', sort = 'latest', page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams({ search, sort, page: String(page), limit: String(limit) });
  return parseResponse(await fetch(`${API_BASE}/pdf?${params}`));
};

export const fetchPdf = async (id) => parseResponse(await fetch(`${API_BASE}/pdf/${id}`));

export const fetchCurrentPdf = async () => parseResponse(await fetch(`${API_BASE}/pdf/current`, { cache: 'no-store' }));

export const uploadPdf = async (formData, onProgress) => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/pdf/upload`);
  getAuthHeaders().then((headers) => {
    Object.entries(headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}');
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || 'PDF upload failed'));
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error('PDF upload failed'));
    xhr.send(formData);
  }).catch(reject);
});

export const updatePdf = async (id, data) => parseResponse(await fetch(`${API_BASE}/pdf/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
  body: JSON.stringify(data)
}));

export const deletePdf = async (id) => parseResponse(await fetch(`${API_BASE}/pdf/${id}`, {
  method: 'DELETE',
  headers: await getAuthHeaders()
}));

export const displayPdf = async (id, settings = {}) => parseResponse(await fetch(`${API_BASE}/pdf/display/${id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
  body: JSON.stringify(settings)
}));

export const stopPdfDisplay = async () => parseResponse(await fetch(`${API_BASE}/pdf/current/stop`, {
  method: 'POST',
  headers: await getAuthHeaders()
}));

export const clearPdfDisplay = async () => parseResponse(await fetch(`${API_BASE}/pdf/current`, {
  method: 'DELETE',
  headers: await getAuthHeaders()
}));
