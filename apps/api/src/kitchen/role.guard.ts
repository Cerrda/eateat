import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { raise } from '../common/http.js';
import type { AppRequest } from '../common/request-context.js';
import type { AppRole } from './kitchen.constants.js';

export const ROLES_KEY = 'roles';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const request = context.switchToHttp().getRequest<AppRequest>();
    if (!request.kitchen || !roles.includes(request.kitchen.role)) {
      raise(HttpStatus.FORBIDDEN, 'ROLE', '这一边做不了这件事');
    }
    return true;
  }
}
