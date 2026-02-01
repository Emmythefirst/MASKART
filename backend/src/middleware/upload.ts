import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { generateToken } from '../utils/crypto.js';
import { storageConfig, isFileTypeAllowed } from '../config/storage.js';

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, storageConfig.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${generateToken(16)}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (isFileTypeAllowed(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${fileExt} not allowed. Allowed types: ${storageConfig.allowedFileTypes.join(', ')}`));
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: storageConfig.maxFileSize,
    files: 5 // Maximum 5 files per request
  }
});

// Error handler for multer errors
export const handleMulterError = (err: any, _req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        success: false,
        error: `File too large. Maximum size is ${storageConfig.maxFileSize / (1024 * 1024)}MB`
      });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({
        success: false,
        error: 'Too many files uploaded'
      });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({
        success: false,
        error: 'Unexpected field in upload'
      });
      return;
    }
  }
  
  if (err) {
    res.status(400).json({
      success: false,
      error: err.message || 'File upload failed'
    });
    return;
  }
  
  next();
};

export default upload;