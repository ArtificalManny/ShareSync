// src/common/filters/mongoose-exception.filter.ts
// ═══════════════════════════════════════════════════════════════════════════════
// MONGOOSE EXCEPTION FILTER
// Optional hardening layer:
// - CastError (invalid ObjectId) => 400
// - Duplicate key (E11000) => 409
// - ValidationError => 400
// - Other mongoose/mongo errors => 500
//
// Safe to add: not active unless registered.
// Example registration (later):
//   app.useGlobalFilters(new MongooseExceptionFilter());
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class MongooseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongooseExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    // If this is already an HTTP exception from Nest, let Nest handle it by rethrowing.
    // BUT in filters we can't "rethrow" cleanly; we detect and pass through.
    // Most Nest HttpExceptions have getStatus().
    if (exception?.getStatus && typeof exception.getStatus === 'function') {
      const status = exception.getStatus();
      const response = exception.getResponse?.() ?? { message: exception.message };
      return res.status(status).json({
        success: false,
        error: response,
        path: req?.url,
        timestamp: new Date().toISOString(),
      });
    }

    const parsed = this.parseMongooseError(exception);

    if (parsed.status >= 500) {
      this.logger.error(parsed.message, exception?.stack || exception);
    }

    return res.status(parsed.status).json({
      success: false,
      error: {
        message: parsed.message,
        details: parsed.details,
      },
      path: req?.url,
      timestamp: new Date().toISOString(),
    });
  }

  private parseMongooseError(err: any): {
    status: number;
    message: string;
    details?: any;
  } {
    // Mongoose CastError (e.g., invalid ObjectId)
    if (err?.name === 'CastError') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid ${err?.path || 'value'}`,
        details: { value: err?.value, kind: err?.kind },
      };
    }

    // Mongo duplicate key error
    if (err?.code === 11000) {
      const keys = err?.keyValue ? Object.keys(err.keyValue) : [];
      return {
        status: HttpStatus.CONFLICT,
        message: 'Duplicate key error',
        details: {
          fields: keys,
          keyValue: err?.keyValue,
        },
      };
    }

    // Mongoose validation error
    if (err?.name === 'ValidationError') {
      const fieldErrors: Record<string, string> = {};
      if (err?.errors) {
        for (const [field, info] of Object.entries<any>(err.errors)) {
          fieldErrors[field] = info?.message || 'Invalid value';
        }
      }
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        details: fieldErrors,
      };
    }

    // MongoServerError (general)
    if (err?.name === 'MongoServerError') {
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Database error',
        details: { code: err?.code, message: err?.message },
      };
    }

    // Default
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'production' ? undefined : { raw: err?.message || String(err) },
    };
  }
}
