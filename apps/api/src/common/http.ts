import { HttpException, HttpStatus } from '@nestjs/common';

export function raise(
  status: HttpStatus,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): never {
  throw new HttpException(
    {
      statusCode: status,
      code,
      message,
      ...extra,
    },
    status,
  );
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : '提交的内容还不能用';
}
