import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'string'
          ? { statusCode: status, message: body, path: request.url }
          : { ...(body as Record<string, unknown>), path: request.url },
      );
      return;
    }

    const prismaCode = readPrismaCode(exception);
    if (prismaCode) {
      const mapped = mapPrismaCode(prismaCode);
      this.logger.error(
        JSON.stringify({
          msg: 'prisma request failed',
          code: prismaCode,
          method: request.method,
          path: request.url,
        }),
      );
      response.status(mapped.status).json({
        statusCode: mapped.status,
        message: mapped.message,
        path: request.url,
      });
      return;
    }

    if (isPrismaValidationError(exception)) {
      this.logger.error(
        JSON.stringify({
          msg: 'prisma validation failed',
          method: request.method,
          path: request.url,
        }),
      );
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: '提交的数据无法处理',
        path: request.url,
      });
      return;
    }

    this.logger.error(
      JSON.stringify({
        msg: 'unhandled exception',
        method: request.method,
        path: request.url,
      }),
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: '服务暂时不可用',
      path: request.url,
    });
  }
}

function readPrismaCode(exception: unknown): string | undefined {
  if (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    'clientVersion' in exception &&
    typeof exception.code === 'string' &&
    exception.code.startsWith('P')
  ) {
    return exception.code;
  }

  return undefined;
}

function isPrismaValidationError(exception: unknown): boolean {
  return exception instanceof Error && exception.name === 'PrismaClientValidationError';
}

function mapPrismaCode(code: string): { status: number; message: string } {
  switch (code) {
    case 'P2002':
      return { status: HttpStatus.CONFLICT, message: '记录已存在' };
    case 'P2025':
      return { status: HttpStatus.NOT_FOUND, message: '记录不存在' };
    case 'P2003':
      return { status: HttpStatus.BAD_REQUEST, message: '关联数据不存在' };
    default:
      return { status: HttpStatus.BAD_REQUEST, message: '请求无法处理' };
  }
}
