import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { raise } from '../common/http.js';
import type { AppRequest } from '../common/request-context.js';
import { AuthRepository } from './auth.repository.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) {
      raise(HttpStatus.UNAUTHORIZED, 'AUTH', '请先进入厨房');
    }

    const session = await this.auth.findMemberByToken(token);
    if (!session) {
      raise(HttpStatus.UNAUTHORIZED, 'AUTH', '请先进入厨房');
    }

    request.member = { id: session.member.id };
    return true;
  }
}
