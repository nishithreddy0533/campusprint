import { Router } from 'express';
import multer from 'multer';
import { storeFile, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../services/uploadService.js';

const router = Router();

// Use memory storage so we can validate before writing to disk/S3
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error('Unsupported file type. Allowed: PDF, JPEG, PNG, DOC, DOCX.'), {
          status: 400,
        })
      );
    }
  },
});

// POST /api/upload
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds the 20 MB limit.' });
      }
      return res.status(err.status || 400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided. Include a file in the "file" field.' });
    }

    try {
      const fileUrl = await storeFile(req.file);
      return res.status(200).json({ fileUrl, fileName: req.file.originalname });
    } catch (storeErr) {
      next(storeErr);
    }
  });
});

export default router;
