import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import fs from 'fs/promises';
import admin, { getAdminDb } from '../services/firebaseAdmin.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadRoot = path.resolve(__dirname, '../../uploads/pdfs');
const MAX_PDF_BYTES = 100 * 1024 * 1024;
const PDF_COLLECTION = 'pdfDocuments';
const DISPLAY_COLLECTION = 'pdfDisplay';
const DISPLAY_DOC = 'current';

mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
    cb(null, `${Date.now()}-${safeBase}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PDF_BYTES },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    cb(isPdf ? null : new Error('Only PDF files are allowed.'), isPdf);
  }
});

const timestamp = () => admin.firestore.FieldValue.serverTimestamp();

const allowLocalAdmin = (req) => {
  const isLocal = req.get('x-local-admin') === 'true';
  return isLocal && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_LOCAL_ADMIN === 'true');
};

const requirePdfAdmin = async (req, res, next) => {
  try {
    if (allowLocalAdmin(req)) return next();
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    req.user = await admin.auth().verifyIdToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const serializeDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const serializePdf = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: serializeDate(data.createdAt),
    updatedAt: serializeDate(data.updatedAt)
  };
};

const normalizePdf = (item) => ({
  ...item,
  filesize: Number(item.filesize || 0),
  pages: Number(item.pages || 0),
  status: item.status || (item.isActive === false ? 'inactive' : 'active'),
  isActive: item.isActive !== false,
  isDisplaying: item.isDisplaying === true
});

const deleteUploadedFile = async (filepath = '') => {
  if (!filepath.startsWith('/uploads/pdfs/')) return;
  const absolutePath = path.resolve(__dirname, '../..', `.${filepath}`);
  if (!absolutePath.startsWith(uploadRoot)) return;
  await fs.unlink(absolutePath).catch(() => {});
};

const listPdfs = async () => {
  const snap = await getAdminDb().collection(PDF_COLLECTION).get();
  return snap.docs.map((doc) => normalizePdf(serializePdf(doc)));
};

router.post('/upload', requirePdfAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF file is required.' });
    const relativePath = `/uploads/pdfs/${req.file.filename}`;
    const payload = {
      title: String(req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).trim(),
      description: String(req.body.description || '').trim(),
      category: String(req.body.category || '').trim(),
      filename: req.file.originalname,
      storedFilename: req.file.filename,
      filepath: relativePath,
      fileUrl: `${getBaseUrl(req)}${relativePath}`,
      thumbnail: req.body.thumbnail || '',
      filesize: req.file.size,
      pages: Math.max(0, Math.round(Number(req.body.pages) || 0)),
      status: 'active',
      isActive: true,
      isDisplaying: false,
      createdAt: timestamp(),
      updatedAt: timestamp()
    };
    const ref = await getAdminDb().collection(PDF_COLLECTION).add(payload);
    const snap = await ref.get();
    return res.status(201).json({ pdf: normalizePdf(serializePdf(snap)) });
  } catch (error) {
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    return next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const sort = String(req.query.sort || 'latest');
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    let items = await listPdfs();

    if (search) {
      items = items.filter((item) => [item.title, item.description, item.category, item.filename].some((value) => String(value || '').toLowerCase().includes(search)));
    }

    items.sort((left, right) => {
      if (sort === 'oldest') return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
      if (sort === 'title') return String(left.title || '').localeCompare(String(right.title || ''));
      return String(right.createdAt || '').localeCompare(String(left.createdAt || ''));
    });

    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    return res.json({ items: items.slice(start, start + limit), total, page, pages, limit });
  } catch (error) {
    return next(error);
  }
});

router.get('/current', async (req, res, next) => {
  try {
    const currentSnap = await getAdminDb().collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC).get();
    if (!currentSnap.exists || currentSnap.data().isRunning === false || !currentSnap.data().pdfId) {
      return res.json({ current: null });
    }
    const current = currentSnap.data();
    const pdfSnap = await getAdminDb().collection(PDF_COLLECTION).doc(current.pdfId).get();
    if (!pdfSnap.exists) return res.json({ current: null });
    return res.json({
      current: {
        ...current,
        updatedAt: serializeDate(current.updatedAt),
        pdf: normalizePdf(serializePdf(pdfSnap))
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.delete('/current', requirePdfAdmin, async (_req, res, next) => {
  try {
    const db = getAdminDb();
    const displaying = await db.collection(PDF_COLLECTION).where('isDisplaying', '==', true).get();
    const batch = db.batch();
    displaying.docs.forEach((doc) => batch.set(doc.ref, { isDisplaying: false, updatedAt: timestamp() }, { merge: true }));
    batch.set(db.collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC), { pdfId: null, isRunning: false, updatedAt: timestamp() }, { merge: true });
    await batch.commit();
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const snap = await getAdminDb().collection(PDF_COLLECTION).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'PDF not found.' });
    return res.json({ pdf: normalizePdf(serializePdf(snap)) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', requirePdfAdmin, async (req, res, next) => {
  try {
    const data = {};
    ['title', 'description', 'category', 'thumbnail'].forEach((key) => {
      if (key in req.body) data[key] = String(req.body[key] || '').trim();
    });
    if ('pages' in req.body) data.pages = Math.max(0, Math.round(Number(req.body.pages) || 0));
    if ('status' in req.body || 'isActive' in req.body) {
      const isActive = req.body.isActive ?? req.body.status !== 'inactive';
      data.isActive = !!isActive;
      data.status = isActive ? 'active' : 'inactive';
    }
    data.updatedAt = timestamp();
    await getAdminDb().collection(PDF_COLLECTION).doc(req.params.id).set(data, { merge: true });
    const snap = await getAdminDb().collection(PDF_COLLECTION).doc(req.params.id).get();
    if (!snap.exists) return res.status(404).json({ error: 'PDF not found.' });
    return res.json({ pdf: normalizePdf(serializePdf(snap)) });
  } catch (error) {
    return next(error);
  }
});

router.delete('/:id', requirePdfAdmin, async (req, res, next) => {
  try {
    const db = getAdminDb();
    const ref = db.collection(PDF_COLLECTION).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'PDF not found.' });
    const pdf = normalizePdf(serializePdf(snap));
    await deleteUploadedFile(pdf.filepath);
    await ref.delete();
    const currentRef = db.collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC);
    const currentSnap = await currentRef.get();
    if (currentSnap.exists && currentSnap.data().pdfId === req.params.id) {
      await currentRef.set({ pdfId: null, isRunning: false, updatedAt: timestamp() }, { merge: true });
    }
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.post('/display/:id', requirePdfAdmin, async (req, res, next) => {
  try {
    const db = getAdminDb();
    const ref = db.collection(PDF_COLLECTION).doc(req.params.id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'PDF not found.' });

    const batch = db.batch();
    const displaying = await db.collection(PDF_COLLECTION).where('isDisplaying', '==', true).get();
    displaying.docs.forEach((doc) => batch.set(doc.ref, { isDisplaying: false, updatedAt: timestamp() }, { merge: true }));
    batch.set(ref, { isDisplaying: true, isActive: true, status: 'active', updatedAt: timestamp() }, { merge: true });
    batch.set(db.collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC), {
      pdfId: req.params.id,
      isRunning: true,
      autoChangeSeconds: Math.max(1, Number(req.body.autoChangeSeconds) || 8),
      loop: req.body.loop !== false,
      showPageNumber: req.body.showPageNumber !== false,
      updatedAt: timestamp()
    }, { merge: true });
    await batch.commit();
    const current = await db.collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC).get();
    return res.json({ current: { ...current.data(), updatedAt: serializeDate(current.data().updatedAt) } });
  } catch (error) {
    return next(error);
  }
});

router.post('/current/stop', requirePdfAdmin, async (_req, res, next) => {
  try {
    await getAdminDb().collection(DISPLAY_COLLECTION).doc(DISPLAY_DOC).set({ isRunning: false, updatedAt: timestamp() }, { merge: true });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
