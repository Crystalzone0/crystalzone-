import multer from 'multer';
import AppError from '../utils/AppError.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES = 8;

// Files stay in memory and are streamed straight to Cloudinary: nothing is written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true);
    return cb(new AppError('Only JPG, PNG or WebP images are allowed', 400));
  },
});

const MESSAGES = {
  LIMIT_FILE_SIZE: 'Each image must be 5 MB or smaller',
  LIMIT_FILE_COUNT: `You can upload up to ${MAX_FILES} images at a time`,
  LIMIT_UNEXPECTED_FILE: `You can upload up to ${MAX_FILES} images at a time (form field name must be "images")`,
};

/** Accepts up to 8 files in the multipart field "images" and exposes them as req.files. */
export const handleImageUpload = (req, res, next) => {
  upload.array('images', MAX_FILES)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(new AppError(MESSAGES[err.code] || err.message, 400));
    }
    return next(err);
  });
};