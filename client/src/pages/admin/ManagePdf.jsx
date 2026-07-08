import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, FileText, Loader2, MonitorPlay, Pause, RefreshCw, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { clearPdfDisplay, deletePdf, displayPdf, fetchCurrentPdf, fetchPdfs, getPdfFileUrl, stopPdfDisplay, updatePdf, uploadPdf, validateDrivePdf, saveDrivePdf } from '@/services/pdfApi';
import { getPdfDetails } from '@/utils/pdfRenderer';
import { confirmToast, toastError, toastSuccess } from '@/utils/toastUtils.jsx';

const emptyForm = {
  title: '',
  description: '',
  category: ''
};

const ManagePdf = () => {
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('latest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfMeta, setPdfMeta] = useState({ pages: 0, thumbnail: '' });
  const [previewUrl, setPreviewUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editing, setEditing] = useState(null);
  const [previewing, setPreviewing] = useState(null);
  const [displaySettings, setDisplaySettings] = useState({ autoChangeSeconds: 8, loop: true, showPageNumber: true });
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'drive'
  const [driveUrl, setDriveUrl] = useState('');
  const [isVerifyingDrive, setIsVerifyingDrive] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [list, currentResponse] = await Promise.all([
        fetchPdfs({ search: query, sort, page, limit: 8 }),
        fetchCurrentPdf()
      ]);
      setItems(list.items || []);
      setTotalPages(list.pages || 1);
      setCurrent(currentResponse.current || null);
      if (currentResponse.current) {
        setDisplaySettings({
          autoChangeSeconds: currentResponse.current.autoChangeSeconds || 8,
          loop: currentResponse.current.loop !== false,
          showPageNumber: currentResponse.current.showPageNumber !== false
        });
      }
    } catch (error) {
      toastError(error, 'Unable to load PDFs');
    } finally {
      setIsLoading(false);
    }
  }, [page, query, sort]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const currentId = current?.pdfId || current?.pdf?.id;
  const selectedFileSize = selectedFile ? formatBytes(selectedFile.size) : '';

  const chooseFile = async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please choose a PDF file only.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error('PDF is larger than 100 MB.');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setForm((state) => ({ ...state, title: state.title || file.name.replace(/\.pdf$/i, '') }));
    setIsPreparing(true);
    try {
      setPdfMeta(await getPdfDetails(file));
    } catch (error) {
      setPdfMeta({ pages: 0, thumbnail: '' });
      toastError(error, 'Could not generate PDF thumbnail');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  };

  const saveUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) return toast.error('Choose a PDF first.');
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const data = new FormData();
      data.append('file', selectedFile);
      data.append('title', form.title || selectedFile.name.replace(/\.pdf$/i, ''));
      data.append('description', form.description || '');
      data.append('category', form.category || '');
      data.append('pages', String(pdfMeta.pages || 0));
      data.append('thumbnail', pdfMeta.thumbnail || '');
      await uploadPdf(data, setUploadProgress);
      toastSuccess('PDF uploaded successfully');
      setSelectedFile(null);
      setPdfMeta({ pages: 0, thumbnail: '' });
      setForm(emptyForm);
      setUploadProgress(0);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setPage(1);
      await loadData();
    } catch (error) {
      toastError(error, 'PDF upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const extractFileId = (url = '') => {
    const reg1 = /\/file\/d\/([a-zA-Z0-9_-]+)/;
    const reg2 = /[?&]id=([a-zA-Z0-9_-]+)/;
    const match1 = String(url).match(reg1);
    if (match1) return match1[1];
    const match2 = String(url).match(reg2);
    if (match2) return match2[1];
    return null;
  };

  const verifyAndLoadDrivePdf = async () => {
    if (!driveUrl) return toast.error('Please enter a Google Drive link.');
    const fileId = extractFileId(driveUrl);
    if (!fileId) return toast.error('Invalid Google Drive link format.');

    setIsVerifyingDrive(true);
    try {
      // 1. Validate public access
      await validateDrivePdf(driveUrl);
      
      // 2. Fetch the file via the proxy to generate page count & thumbnail
      toast.loading('Downloading file details...', { id: 'drive-loading' });
      
      const clientBase = import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_SERVER_URL ? `${import.meta.env.VITE_SERVER_URL}/api` : '');
      const proxyUrl = clientBase ? `${clientBase}/pdf/proxy/${fileId}` : `/api/pdf/proxy/${fileId}`;
      
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to download file from proxy.');
      }
      
      const blob = await response.blob();
      const file = new File([blob], 'google-drive-file.pdf', { type: 'application/pdf' });
      
      toast.dismiss('drive-loading');
      toast.success('File loaded. Parsing details...');
      
      await chooseFile(file);
    } catch (error) {
      toast.dismiss('drive-loading');
      toastError(error, 'Failed to load Google Drive PDF');
    } finally {
      setIsVerifyingDrive(false);
    }
  };

  const saveDrive = async (event) => {
    event.preventDefault();
    if (!driveUrl) return toast.error('Enter a Google Drive link.');
    const fileId = extractFileId(driveUrl);
    if (!fileId) return toast.error('Invalid Google Drive link format.');
    if (!pdfMeta.pages) return toast.error('Please click "Verify & Load PDF" first to validate the document.');

    setIsUploading(true);
    try {
      await saveDrivePdf({
        title: form.title || 'Google Drive PDF',
        description: form.description || '',
        category: form.category || '',
        driveUrl,
        pages: pdfMeta.pages,
        thumbnail: pdfMeta.thumbnail
      });
      toastSuccess('Google Drive PDF saved successfully');
      setDriveUrl('');
      setPdfMeta({ pages: 0, thumbnail: '' });
      setForm(emptyForm);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
      setPage(1);
      await loadData();
    } catch (error) {
      toastError(error, 'Failed to save Google Drive PDF');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (event) => {
    if (activeTab === 'upload') {
      saveUpload(event);
    } else {
      saveDrive(event);
    }
  };

  const removePdf = async (pdf) => {
    const confirmed = await confirmToast({
      title: 'Delete PDF?',
      message: `Delete "${pdf.title || pdf.filename}"? This removes the document from the TV display library.`,
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      await deletePdf(pdf.id);
      toastSuccess('PDF deleted');
      await loadData();
    } catch (error) {
      toastError(error, 'Delete failed');
    }
  };

  const togglePdf = async (pdf) => {
    try {
      await updatePdf(pdf.id, { isActive: !pdf.isActive });
      await loadData();
    } catch (error) {
      toastError(error, 'Status update failed');
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    try {
      await updatePdf(editing.id, {
        title: editing.title,
        description: editing.description,
        category: editing.category,
        driveUrl: editing.driveUrl
      });
      setEditing(null);
      toastSuccess('PDF updated');
      await loadData();
    } catch (error) {
      toastError(error, 'PDF update failed');
    }
  };

  const startDisplay = async (pdf) => {
    try {
      await displayPdf(pdf.id, displaySettings);
      toastSuccess('TV display updated');
      await loadData();
    } catch (error) {
      toastError(error, 'TV display update failed');
    }
  };

  const stopDisplay = async () => {
    try {
      await stopPdfDisplay();
      toastSuccess('TV display paused');
      await loadData();
    } catch (error) {
      toastError(error, 'Could not pause display');
    }
  };

  const clearDisplay = async () => {
    try {
      await clearPdfDisplay();
      toastSuccess('Current PDF removed from TV');
      await loadData();
    } catch (error) {
      toastError(error, 'Could not remove current PDF');
    }
  };

  const skeletons = useMemo(() => Array.from({ length: 4 }), []);

  return (
    <div className="grid gap-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-xl">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_left,rgba(255,215,0,.22),transparent_34%),linear-gradient(135deg,#0f172a,#111827)] p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-yellow"><FileText size={15} /> PDF TV Management</p>
            <h1 className="mt-2 text-2xl font-black md:text-3xl">Upload, manage, and broadcast PDFs</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/65">Select one active PDF for the fullscreen TV display. The TV page checks for changes every 5 seconds.</p>
          </div>
          <a href="/tv/pdf" target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-5 font-black text-slate-950 shadow-yellow">
            <MonitorPlay size={18} /> Open TV PDF
          </a>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form onSubmit={handleFormSubmit} className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur md:p-5">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tdp-red">Manage PDF</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">New document</h2>
          </div>

          <div className="mb-4 flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setSelectedFile(null); setDriveUrl(''); setPdfMeta({ pages: 0, thumbnail: '' }); setForm(emptyForm); }}
              className={`pb-2 pr-4 text-sm font-black border-b-2 transition ${activeTab === 'upload' ? 'border-tdp-red text-tdp-red' : 'border-transparent text-slate-500'}`}
            >
              Upload File
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('drive'); setSelectedFile(null); setDriveUrl(''); setPdfMeta({ pages: 0, thumbnail: '' }); setForm(emptyForm); }}
              className={`pb-2 px-4 text-sm font-black border-b-2 transition ${activeTab === 'drive' ? 'border-tdp-red text-tdp-red' : 'border-transparent text-slate-500'}`}
            >
              Google Drive Link
            </button>
          </div>

          {activeTab === 'upload' ? (
            <label
              onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`grid min-h-48 cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-5 text-center transition ${isDragging ? 'border-tdp-yellow bg-yellow-50' : 'border-slate-300 bg-slate-50 hover:border-tdp-yellow'}`}
            >
              <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} />
              <span className="grid gap-3 justify-items-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-tdp-yellow"><UploadCloud size={26} /></span>
                <span className="text-base font-black text-slate-950">{selectedFile ? selectedFile.name : 'Drag & drop PDF or click to upload'}</span>
                <span className="text-sm font-semibold text-slate-500">PDF only, up to 100 MB</span>
              </span>
            </label>
          ) : (
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Google Drive Share Link
                <input
                  value={driveUrl}
                  onChange={(event) => setDriveUrl(event.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow"
                />
              </label>
              <button
                type="button"
                disabled={isVerifyingDrive || !driveUrl}
                onClick={verifyAndLoadDrivePdf}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 text-sm font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                {isVerifyingDrive ? <Loader2 size={16} className="animate-spin" /> : null}
                {isVerifyingDrive ? 'Verifying Link...' : 'Verify & Load PDF'}
              </button>
            </div>
          )}

          {pdfMeta.pages > 0 && (
            <div className="mt-4 grid gap-3 rounded-xl bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3 text-sm font-bold text-slate-600">
                <span>{activeTab === 'upload' ? selectedFileSize : 'Google Drive PDF'}</span>
                <span>{pdfMeta.pages} pages</span>
              </div>
              {pdfMeta.thumbnail && <img src={pdfMeta.thumbnail} alt="" className="max-h-48 w-full rounded-lg border border-slate-200 bg-white object-contain" />}
            </div>
          )}

          {isPreparing && activeTab === 'upload' && (
            <div className="mt-4 h-24 animate-pulse rounded-lg bg-slate-200" />
          )}

          <div className="mt-4 grid gap-3">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Title
              <input value={form.title} onChange={(event) => setForm((state) => ({ ...state, title: event.target.value }))} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Category
              <input value={form.category} onChange={(event) => setForm((state) => ({ ...state, category: event.target.value }))} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Description
              <textarea value={form.description} onChange={(event) => setForm((state) => ({ ...state, description: event.target.value }))} className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-tdp-yellow" />
            </label>
          </div>

          {isUploading && activeTab === 'upload' && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-500"><span>Uploading</span><span>{uploadProgress}%</span></div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-tdp-yellow transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <button
            disabled={activeTab === 'upload' ? (isUploading || isPreparing || !selectedFile) : (isUploading || isVerifyingDrive || !pdfMeta.pages)}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-red px-5 text-base font-black text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            {isUploading ? <Loader2 size={18} className="animate-spin" /> : (activeTab === 'upload' ? <UploadCloud size={18} /> : null)} 
            {isUploading ? 'Saving...' : (activeTab === 'upload' ? 'Upload PDF' : 'Save Google Drive PDF')}
          </button>
        </form>

        <section className="grid gap-4">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_160px_120px]">
              <label className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search PDFs" className="min-h-12 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-base font-semibold outline-none focus:border-tdp-yellow" />
              </label>
              <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className="min-h-12 rounded-xl border border-slate-200 px-4 font-bold outline-none focus:border-tdp-yellow">
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="title">Title</option>
              </select>
              <button type="button" onClick={loadData} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-slate-700"><RefreshCw size={17} /> Refresh</button>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-900">Current TV PDF</p>
                <p className="mt-1 text-lg font-black text-slate-950">{current?.pdf?.title || 'No PDF selected'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={stopDisplay} disabled={!current} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-yellow-300 px-4 text-sm font-black text-yellow-900 disabled:opacity-50"><Pause size={16} /> Stop</button>
                <button type="button" onClick={clearDisplay} disabled={!current} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white disabled:opacity-50"><X size={16} /> Remove</button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Auto page seconds
                <input type="number" min="1" value={displaySettings.autoChangeSeconds} onChange={(event) => setDisplaySettings((state) => ({ ...state, autoChangeSeconds: event.target.value }))} className="min-h-11 rounded-xl border border-yellow-200 px-3 outline-none" />
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white/70 px-3 text-sm font-black text-slate-700">
                <input type="checkbox" checked={displaySettings.loop} onChange={(event) => setDisplaySettings((state) => ({ ...state, loop: event.target.checked }))} />
                Loop pages
              </label>
              <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white/70 px-3 text-sm font-black text-slate-700">
                <input type="checkbox" checked={displaySettings.showPageNumber} onChange={(event) => setDisplaySettings((state) => ({ ...state, showPageNumber: event.target.checked }))} />
                Page number
              </label>
            </div>
          </div>

          <div className="grid gap-3">
            {isLoading ? skeletons.map((_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl bg-white/70" />) : items.map((pdf) => (
              <article key={pdf.id} className={`grid gap-4 rounded-2xl border bg-white/80 p-4 shadow-sm backdrop-blur md:grid-cols-[120px_minmax(0,1fr)_auto] ${pdf.id === currentId ? 'border-tdp-yellow ring-2 ring-yellow-200' : 'border-white/70'}`}>
                <div className="grid h-36 place-items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  {pdf.thumbnail ? <img src={pdf.thumbnail} alt="" className="h-full w-full object-cover" /> : <FileText size={38} className="text-slate-400" />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-lg font-black text-slate-950">{pdf.title || pdf.filename}</h3>
                    {pdf.id === currentId && <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-black text-yellow-800"><CheckCircle2 size={13} /> TV</span>}
                    <span className={`rounded-full px-2 py-1 text-xs font-black ${pdf.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{pdf.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">{pdf.description || 'No description'}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-black uppercase tracking-[0.1em] text-slate-500">
                    <span>{pdf.category || 'Uncategorized'}</span>
                    <span>{formatBytes(pdf.filesize)}</span>
                    <span>{pdf.pages || 'Unknown'} pages</span>
                    <span>{formatDate(pdf.createdAt)}</span>
                  </div>
                </div>
                <div className="grid content-start gap-2 sm:grid-cols-2 md:min-w-52">
                  <button type="button" onClick={() => startDisplay(pdf)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-3 text-sm font-black text-slate-950"><MonitorPlay size={16} /> Display</button>
                  <button type="button" onClick={() => setPreviewing(pdf)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700"><Eye size={16} /> Preview</button>
                  <button type="button" onClick={() => setEditing(pdf)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-blue-200 px-3 text-sm font-black text-blue-700">Edit</button>
                  <button type="button" onClick={() => togglePdf(pdf)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700">{pdf.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button type="button" onClick={() => removePdf(pdf)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-black text-red-700 sm:col-span-2"><Trash2 size={16} /> Delete</button>
                </div>
              </article>
            ))}
            {!isLoading && !items.length && <div className="rounded-2xl bg-white/75 p-8 text-center font-bold text-slate-500">No PDFs found.</div>}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-white/75 p-3">
            <button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-slate-700 disabled:opacity-40"><ChevronLeft size={17} /> Prev</button>
            <span className="text-sm font-black text-slate-600">Page {page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-slate-700 disabled:opacity-40">Next <ChevronRight size={17} /></button>
          </div>
        </section>
      </section>

      {previewing && (
        <PdfModal title={previewing.title || previewing.filename} onClose={() => setPreviewing(null)}>
          <iframe title={previewing.title || 'PDF preview'} src={getPdfFileUrl(previewing)} className="h-[78vh] w-full rounded-xl bg-slate-950" />
        </PdfModal>
      )}

      {editing && (
        <PdfModal title="Edit PDF" onClose={() => setEditing(null)}>
          <form onSubmit={saveEdit} className="grid gap-4">
            {editing.sourceType === 'drive' && (
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Google Drive URL
                <input value={editing.driveUrl || ''} onChange={(event) => setEditing((state) => ({ ...state, driveUrl: event.target.value }))} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
              </label>
            )}
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Title
              <input value={editing.title || ''} onChange={(event) => setEditing((state) => ({ ...state, title: event.target.value }))} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Category
              <input value={editing.category || ''} onChange={(event) => setEditing((state) => ({ ...state, category: event.target.value }))} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
            </label>
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Description
              <textarea value={editing.description || ''} onChange={(event) => setEditing((state) => ({ ...state, description: event.target.value }))} className="min-h-28 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-tdp-yellow" />
            </label>
            <button className="min-h-12 rounded-xl bg-tdp-red px-5 font-black text-white shadow-red">Save Changes</button>
          </form>
        </PdfModal>
      )}
    </div>
  );
};

const PdfModal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm">
    <section className="max-h-[92vh] w-[min(96vw,960px)] overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-slate-200 p-4">
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><X size={18} /></button>
      </header>
      <div className="max-h-[82vh] overflow-y-auto p-4">{children}</div>
    </section>
  </div>
);

const formatBytes = (bytes = 0) => {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (value) => {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default ManagePdf;
