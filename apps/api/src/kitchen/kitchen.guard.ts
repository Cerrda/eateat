import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { raise } from '../common/http.js';
import type { AppRequest } from '../common/request-context.js';
import { KitchenRepository } from './kitchen.repository.js';

@Injectable()
export class KitchenGuard implements CanActivate {
  constructor(private readonly kitchens: KitchenRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AppRequest>();
    const memberId = request.member?.id;
    if (!memberId) {
      raise(HttpStatus.UNAUTHORIZED, 'AUTH', '请先进入厨房');
    }

    const membership = await this.kitchens.findActive(memberId);
    if (!membership || membership.kitchen.status === 'DISSOLVED') {
      raise(HttpStatus.FORBIDDEN, 'NO_KITCHEN', '还没有厨房');
    }
    if (membership.kitchen.status !== 'BOUND') {
      raise(HttpStatus.FORBIDDEN, 'KITCHEN_PENDING', '对方还没加入');
    }

    request.kitchen = {
      membershipId: membership.id,
      memberId,
      kitchenId: membership.kitchenId,
      role: membership.role,
      displayName: membership.displayName,
      ordersSeenAt: membership.ordersSeenAt,
      recordsSeenAt: membership.recordsSeenAt,
    };
    return true;
  }
}
