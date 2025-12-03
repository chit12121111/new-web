import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // Log error details
    this.logger.error(
      `❌ ${request.method} ${request.url} - Status: ${status}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    // Format error response - include more details in development
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Extract message
    if (typeof message === 'string') {
      errorResponse.message = message;
    } else if (message && typeof message === 'object') {
      errorResponse.message = (message as any).message || 'Internal server error';
      // Include additional error details in development
      if (isDevelopment && (message as any).error) {
        errorResponse.error = (message as any).error;
      }
    } else {
      errorResponse.message = exception instanceof Error ? exception.message : 'Internal server error';
    }

    // Include stack trace in development for debugging
    if (isDevelopment && exception instanceof Error && exception.stack) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}

