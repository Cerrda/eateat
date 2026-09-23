import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { cookerTodoBadge, eaterOrderBadge, recordBadge } from '../domain/badges.js';
import { raise, messageOf } from '../common/http.js';
import { assertDisplayName } from '../domain/text.js';
import { ROLE_LABEL, otherRole, type AppRole } from './kitchen.constants.js';
import { createInviteCode, KitchenRepository } from './kitchen.repository.js';

@Injectable()
export class KitchenService {
  constructor(private readonly kitchens: KitchenRepository) {}

  async me(memberId: string) {
    const membership = await this.kitchens.findActive(memberId);
    if (!membership || membership.kitchen.status === 'DISSOLVED') {
      return { memberId, membership: null, badges: { todo: 0, orders: 0, records: 0 } };
    }

    const [people, invite, pending, orderNotices, newRecords] = await Promise.all([
      this.kitchens.findKitchenMembers(membership.kitchenId),
      membership.kitchen.status === 'PENDING'
        ? this.kitchens.findCurrentInvite(membership.kitchenId)
        : Promise.resolve(null),
      this.kitchens.countPending(membership.kitchenId),
      this.kitchens.countEaterNotices(membership.kitchenId, membership.ordersSeenAt),
      this.kitchens.countNewRecords(membership.kitchenId, membership.recordsSeenAt),
    ]);
    const partner = people.find((person) => person.memberId !== memberId) ?? null;
    const role = membership.role;

    return {
      memberId,
      membership: {
        id: membership.id,
        role,
        displayName: membership.displayName,
        kitchenId: membership.kitchenId,
        kitchenStatus: membership.kitchen.status,
        partner: partner
          ? { displayName: partner.displayName, role: partner.role }
          : null,
        invite: invite ? { code: invite.code, expiresAt: invite.expiresAt.toISOString() } : null,
      },
      badges: {
        todo: role === 'COOKER' ? cookerTodoBadge(pending) : 0,
        orders: role === 'EATER' ? eaterOrderBadge(orderNotices) : 0,
        records: role === 'EATER' ? recordBadge(newRecords) : 0,
      },
    };
  }

  async create(memberId: string, role: AppRole) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await this.kitchens.transaction(async (tx) => {
          const existing = await this.kitchens.findActive(memberId, tx);
          if (existing) {
            raise(HttpStatus.CONFLICT, 'ALREADY_IN_KITCHEN', '你已经有厨房');
          }
          await this.kitchens.createPendingKitchen(tx, memberId, role, createInviteCode());
        });
        return this.me(memberId);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 4) {
          continue;
        }
        throw error;
      }
    }
    raise(HttpStatus.CONFLICT, 'INVITE', '邀请码没生成成功，再试一次');
  }

  async refreshInvite(memberId: string) {
    const membership = await this.requireActive(memberId);
    if (membership.kitchen.status !== 'PENDING') {
      raise(HttpStatus.CONFLICT, 'ALREADY_BOUND', '对方已经加入，不用再换邀请码');
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const [, invite] = await this.kitchens.transaction((tx) =>
          this.kitchens.revokeAndCreateInvite(tx, membership.kitchenId, createInviteCode()),
        );
        return { code: invite.code, expiresAt: invite.expiresAt.toISOString() };
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002' && attempt < 4) {
          continue;
        }
        throw error;
      }
    }
    raise(HttpStatus.CONFLICT, 'INVITE', '邀请码没生成成功，再试一次');
  }

  async preview(memberId: string, code: string) {
    const invite = await this.kitchens.findLiveInvite(code.trim().toUpperCase());
    if (!invite || invite.kitchen.status === 'DISSOLVED') {
      return { kind: 'invalid' as const, code };
    }

    const mine = await this.kitchens.findActive(memberId);
    if (mine && mine.kitchenId === invite.kitchenId) {
      return { kind: 'self' as const, code: invite.code };
    }
    if (mine?.kitchen.status === 'BOUND') {
      return { kind: 'already' as const, code: invite.code };
    }
    if (invite.kitchen.status !== 'PENDING') {
      return { kind: 'invalid' as const, code };
    }

    const people = await this.kitchens.findKitchenMembers(invite.kitchenId);
    const creator = people[0];
    if (!creator) {
      return { kind: 'invalid' as const, code };
    }

    const payload = {
      code: invite.code,
      partnerName: creator.displayName,
      partnerRole: creator.role,
      yourRole: otherRole(creator.role),
    };
    if (mine?.kitchen.status === 'PENDING') {
      return { kind: 'abandon' as const, ...payload };
    }
    return { kind: 'join' as const, ...payload };
  }

  async join(memberId: string, code: string, abandon: boolean) {
    const normalized = code.trim().toUpperCase();
    try {
      await this.kitchens.transaction(async (tx) => {
        const invite = await this.kitchens.findLiveInvite(normalized, tx);
        if (!invite || invite.kitchen.status !== 'PENDING') {
          raise(HttpStatus.BAD_REQUEST, 'INVITE_INVALID', '过期了，或写错了。请对方重新发。');
        }

        const mine = await this.kitchens.findActive(memberId, tx);
        if (mine && mine.kitchenId === invite.kitchenId) {
          return;
        }
        if (mine?.kitchen.status === 'BOUND') {
          raise(HttpStatus.CONFLICT, 'ALREADY_BOUND', '你已经有厨房');
        }
        if (mine?.kitchen.status === 'PENDING') {
          if (!abandon) {
            raise(HttpStatus.CONFLICT, 'ABANDON_REQUIRED', '接受后，这间空厨房会被放弃。');
          }
          await this.kitchens.dissolve(tx, mine.kitchenId);
        }

        const people = await this.kitchens.findKitchenMembers(invite.kitchenId, tx);
        const creator = people[0];
        if (!creator) {
          raise(HttpStatus.BAD_REQUEST, 'INVITE_INVALID', '过期了，或写错了。请对方重新发。');
        }

        const role = otherRole(creator.role);
        await this.kitchens.addMember(tx, {
          kitchenId: invite.kitchenId,
          memberId,
          role,
          displayName: ROLE_LABEL[role],
        });
        const bound = await this.kitchens.markBound(tx, invite.kitchenId);
        if (bound.count !== 1) {
          raise(HttpStatus.BAD_REQUEST, 'INVITE_INVALID', '过期了，或写错了。请对方重新发。');
        }
        await this.kitchens.revokeInvites(tx, invite.kitchenId);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        raise(HttpStatus.CONFLICT, 'ALREADY_BOUND', '你已经有厨房');
      }
      throw error;
    }

    return this.me(memberId);
  }

  async unbind(memberId: string) {
    const membership = await this.requireActive(memberId);
    await this.kitchens.transaction((tx) => this.kitchens.dissolve(tx, membership.kitchenId));
    return { ok: true };
  }

  async rename(memberId: string, displayName: string) {
    const membership = await this.requireActive(memberId);
    let name = '';
    try {
      name = assertDisplayName(displayName);
    } catch (error) {
      raise(HttpStatus.BAD_REQUEST, 'NAME', messageOf(error));
    }
    await this.kitchens.updateName(membership.id, name);
    return this.me(memberId);
  }

  async seen(memberId: string, surface: 'orders' | 'records') {
    const membership = await this.requireActive(memberId);
    await this.kitchens.markSeen(membership.id, surface);
    return this.me(memberId);
  }

  private async requireActive(memberId: string) {
    const membership = await this.kitchens.findActive(memberId);
    if (!membership || membership.kitchen.status === 'DISSOLVED') {
      raise(HttpStatus.FORBIDDEN, 'NO_KITCHEN', '还没有厨房');
    }
    return membership;
  }
}
