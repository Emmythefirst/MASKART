import { Request, Response, NextFunction } from 'express';

interface MongooseError extends Error {
  code?: number;
  keyPattern?: Record<string, number>;
  errors?: Record<string, { message: string }>;
}

export const errorHandler = (
  err: MongooseError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = err.errors 
      ? Object.values(err.errors).map(e => e.message)
      : ['Validation failed'];
    
    res.status(400).json({
      error: 'Validation Error',
      details: errors
    });
    return;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'field';
    res.status(409).json({
      error: 'Duplicate Error',
      message: `${field} already exists`
    });
    return;
  }

  // Mongoose cast error (invalid ID)
  if (err.name === 'CastError') {
    res.status(400).json({
      error: 'Invalid ID format'
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Invalid token'
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Token expired'
    });
    return;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    if (typeof (err as any).code === 'string' && (err as any).code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        error: 'File too large',
        maxSize: '50MB'
      });
      return;
    }
    res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
    return;
  }

  // Default error
  const statusCode = (err as any).statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};