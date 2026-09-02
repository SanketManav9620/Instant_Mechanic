import { Request, Response, NextFunction } from 'express';

// Centralized error response handler.
// Any controller can call next(error) and this middleware catches it,
// preventing raw stack traces from leaking to the client.
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('❌ [ErrorHandler]', err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Catches any request that doesn't match a defined route.
// Returns a clear 404 JSON response instead of an HTML error page.
export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};
