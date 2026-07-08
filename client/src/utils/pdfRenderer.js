import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const loadPdfDocument = (source) => pdfjsLib.getDocument(source).promise;

export const getPdfDetails = async (file) => {
  const data = await file.arrayBuffer();
  const pdf = await loadPdfDocument({ data });
  const pages = pdf.numPages;
  const thumbnail = await renderPdfThumbnail(pdf);
  await pdf.destroy();
  return { pages, thumbnail };
};

export const renderPdfThumbnail = async (pdf) => {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const targetWidth = 560;
  const scale = targetWidth / viewport.width;
  const scaled = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { alpha: false });
  canvas.width = Math.floor(scaled.width);
  canvas.height = Math.floor(scaled.height);
  await page.render({ canvasContext: context, viewport: scaled }).promise;
  page.cleanup();
  return canvas.toDataURL('image/jpeg', 0.78);
};

export const renderPdfPageToCanvas = async ({ pdf, pageNumber, canvas, container, maxScale = 2.4 }) => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const box = container.getBoundingClientRect();
  const fitScale = Math.min(box.width / viewport.width, box.height / viewport.height);
  const renderScale = Math.max(0.2, Math.min(maxScale, fitScale * window.devicePixelRatio));
  const displayScale = Math.max(0.2, fitScale);
  const renderViewport = page.getViewport({ scale: renderScale });
  const displayViewport = page.getViewport({ scale: displayScale });
  const context = canvas.getContext('2d', { alpha: false });

  canvas.width = Math.floor(renderViewport.width);
  canvas.height = Math.floor(renderViewport.height);
  canvas.style.width = `${Math.floor(displayViewport.width)}px`;
  canvas.style.height = `${Math.floor(displayViewport.height)}px`;

  await page.render({ canvasContext: context, viewport: renderViewport }).promise;
  page.cleanup();
  return { width: displayViewport.width, height: displayViewport.height };
};
