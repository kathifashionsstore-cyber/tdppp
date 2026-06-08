import { Router } from 'express';
import axios from 'axios';
import FormData from 'form-data';

const router = Router();

router.post('/image', async (req, res, next) => {
  try {
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
