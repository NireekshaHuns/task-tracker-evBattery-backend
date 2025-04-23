import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const errorHandler = (
  err: Error | ApiError | any, // Use 'any' to handle various error types
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if it's a rate limit error from express-rate-limit
  // Rate limiter errors typically have status code 429 embedded
  if (err.statusCode === 429 || (err.status === 429)) {
    res.status(429).json({
      message: 'Rate limit exceeded. Please try again later.',
      error: 'TOO_MANY_REQUESTS'
    });
    return;
  }
  
  // For our custom ApiError
  if ('statusCode' in err) {
    res.status(err.statusCode).json({
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
    return;
  }
  
  // Default for standard errors
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}