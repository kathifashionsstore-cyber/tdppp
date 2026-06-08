import { Router } from 'express';
import axios from 'axios';
import FormData from 'form-data';

const router = Router();
const MAX_IMAGE_BYTES = 300 * 1024;

const getBase64Size = (value = '') => {
  const base64 = String(value).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  return Buffer.from(base64, 'base64').length;
};

router.post('/image', async (req, res, next) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: 'Image is required.' });
    if (getBase64Size(req.body.image) > MAX_IMAGE_BYTES) {
      return res.status(413).json({
        error: 'Image too large. Maximum allowed size is 300KB. Please compress before uploading.'
      });
    }
    const form = new FormData();
    form.append('key', process.env.IMGBB_API_KEY || '202b1fcbad15a90cccbd9e2a44bcb4fa');
    form.append('image', req.body.image);
    if (req.body.name) form.append('name', req.body.name);
    const response = await axios.post('https://api.imgbb.com/1/upload', form, { headers: form.getHeaders() });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

export default router;
