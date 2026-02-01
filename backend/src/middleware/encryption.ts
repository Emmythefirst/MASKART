import { Request, Response, NextFunction } from 'express';
import { encryptProductFile } from '../services/encryptionService.js';
import fs from 'fs/promises';

/**
 * Middleware to encrypt uploaded files
 */
export const encryptUploadedFile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if file was uploaded
    const file = (req.files as any)?.productFile?.[0];
    
    if (!file) {
      next();
      return;
    }

    console.log('Encrypting uploaded file:', file.filename);

    // Encrypt the file
    const { encryptedBuffer, encryptionKey } = await encryptProductFile(file.path);

    // Store encrypted data in request for later use
    req.body.encryptedFileData = {
      buffer: encryptedBuffer,
      key: encryptionKey,
      originalPath: file.path,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };

    next();
  } catch (error) {
    console.error('File encryption error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to encrypt file'
    });
  }
};

/**
 * Cleanup temporary files after processing
 */
export const cleanupTempFiles = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const files = req.files as any;
    
    if (files) {
      // Delete all uploaded files
      const filePaths: string[] = [];
      
      for (const field in files) {
        if (Array.isArray(files[field])) {
          files[field].forEach((file: any) => {
            filePaths.push(file.path);
          });
        }
      }

      // Delete files asynchronously (don't wait)
      Promise.all(
        filePaths.map(path => 
          fs.unlink(path).catch(err => 
            console.error('Failed to delete temp file:', err)
          )
        )
      );
    }

    next();
  } catch (error) {
    console.error('Cleanup error:', error);
    next();
  }
};

/**
 * Validate file encryption requirements
 */
export const validateEncryption = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { encryptedFileHash, encryptedKey } = req.body;

  if (!encryptedFileHash || !encryptedKey) {
    res.status(400).json({
      success: false,
      error: 'File encryption data is required'
    });
    return;
  }

  next();
};