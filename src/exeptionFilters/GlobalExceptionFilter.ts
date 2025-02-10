import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as any).message;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Handle general errors
      message = exception.message;
    }

    // Log the error (in both development and production)
    // this.logError(exception, request)

    // Send environment-specific error response
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracted Message:', message);
      console.log('Status Code:', statusCode);
      this.sendDevelopmentError(response, statusCode, message, exception, request);
    } else {
      this.sendProductionError(exception, response, statusCode, message);
    }
  }

  // private logError(exception: unknown, request: Request): void {
  //   console.error(`[${new Date().toISOString()}] Error occurred:`)
  //   console.error(`Path: ${request.url}`)
  //   console.error(`Error: ${exception}`)
  //   if (exception instanceof Error && exception.stack) {
  //     console.error(`Stack: ${exception.stack}`)
  //   }
  // }

  private sendDevelopmentError(
    response: Response,
    statusCode: number,
    message: string,
    exception: unknown,
    request: Request,
  ): void {
    let stackTrace = null;

    if (exception instanceof Error) {
      stackTrace = exception.stack;
    } else if (typeof exception === 'object' && exception !== null) {
      stackTrace = JSON.stringify(exception, null, 2); // Convert object error to string
    } else {
      stackTrace = String(exception); // Convert unknown errors to string
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      stack: stackTrace,
    });
  }

  private sendProductionError(
    exception: any,
    response: Response,
    statusCode: number,
    message: string,
  ): void {
    console.log(exception);
    response.status(statusCode).json({
      success: false,
      message: message || 'An error occurred',
    });
  }
}
