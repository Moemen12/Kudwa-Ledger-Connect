import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApplicationError } from '../../lib/errors/application-error';
import { fail } from '../../lib/http/api-response';

@Catch()
export class ApplicationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApplicationExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const normalized = this.normalizeException(exception);

    if (normalized.statusCode >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      this.logger.error(
        normalized.message,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(normalized.statusCode).json(
      fail({
        code: normalized.code,
        message: normalized.message,
        details: normalized.details,
      }),
    );
  }

  private normalizeException(exception: unknown) {
    if (exception instanceof ApplicationError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        code: `HTTP_${exception.getStatus()}`,
        message: this.getHttpExceptionMessage(exception),
        details: undefined,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred.',
      details: undefined,
    };
  }

  private getHttpExceptionMessage(exception: HttpException) {
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;

      if (Array.isArray(message)) {
        return message.join(', ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return exception.message;
  }
}
