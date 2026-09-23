import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ROLE_LABEL, type AppRole } from './kitchen.constants.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function createInviteCode(): string {
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

const membershipSelect = {
  id: true,
  kitchenId: true,
  memberId: true,
  role: true,
  displayName: true,
  ordersSeenAt: true,
  recordsSeenAt: true,
  leftAt: true,
  kitchen: { select: { id: true, status: true } },
} satisfies Prisma.MembershipSelect;

@Injectable()
export class KitchenRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  findActive(memberId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.membership.findFirst({
      where: { memberId, leftAt: null },
      select: membershipSelect,
    });
  }

  findKitchenMembers(kitchenId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.membership.findMany({
      where: { kitchenId, leftAt: null },
      select: { id: true, memberId: true, role: true, displayName: true },
    });
  }

  findLiveInvite(code: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    return db.invite.findFirst({
      where: { code, revokedAt: null, expiresAt: { gt: new Date() } },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        kitchenId: true,
        kitchen: { select: { id: true, status: true } },
      },
    });
  }

  findCurrentInvite(kitchenId: string) {
    return this.prisma.invite.findFirst({
      where: { kitchenId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { code: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  createPendingKitchen(tx: Prisma.TransactionClient, memberId: string, role: AppRole, code: string) {
    return tx.kitchen
      .create({
        data: {
          status: 'PENDING',
          memberships: {
            create: {
              memberId,
              role,
              displayName: ROLE_LABEL[role],
              activeMemberKey: memberId,
            },
          },
          invites: {
            create: {
              code,
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
          },
        },
        select: {
          id: true,
          status: true,
          memberships: { select: membershipSelect },
          invites: { select: { code: true, expiresAt: true } },
        },
      });
  }

  dissolve(tx: Prisma.TransactionClient, kitchenId: string) {
    const now = new Date();
    return Promise.all([
      tx.kitchen.update({ where: { id: kitchenId }, data: { status: 'DISSOLVED' } }),
      tx.membership.updateMany({
        where: { kitchenId, leftAt: null },
        data: { leftAt: now, activeMemberKey: null },
      }),
      tx.invite.updateMany({
        where: { kitchenId, revokedAt: null },
        data: { revokedAt: now },
      }),
    ]);
  }

  revokeAndCreateInvite(tx: Prisma.TransactionClient, kitchenId: string, code: string) {
    const now = new Date();
    return Promise.all([
      tx.invite.updateMany({
        where: { kitchenId, revokedAt: null },
        data: { revokedAt: now },
      }),
      tx.invite.create({
        data: {
          kitchenId,
          code,
          expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
        },
        select: { code: true, expiresAt: true },
      }),
    ]);
  }

  addMember(
    tx: Prisma.TransactionClient,
    input: { kitchenId: string; memberId: string; role: AppRole; displayName: string },
  ) {
    return tx.membership.create({
      data: {
        kitchenId: input.kitchenId,
        memberId: input.memberId,
        role: input.role,
        displayName: input.displayName,
        activeMemberKey: input.memberId,
      },
      select: membershipSelect,
    });
  }

  markBound(tx: Prisma.TransactionClient, kitchenId: string) {
    return tx.kitchen.updateMany({
      where: { id: kitchenId, status: 'PENDING' },
      data: { status: 'BOUND' },
    });
  }

  revokeInvites(tx: Prisma.TransactionClient, kitchenId: string) {
    return tx.invite.updateMany({
      where: { kitchenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  updateName(membershipId: string, displayName: string) {
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { displayName },
      select: { displayName: true },
    });
  }

  markSeen(membershipId: string, surface: 'orders' | 'records') {
    const now = new Date();
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: surface === 'orders' ? { ordersSeenAt: now } : { recordsSeenAt: now },
      select: { ordersSeenAt: true, recordsSeenAt: true },
    });
  }

  countPending(kitchenId: string) {
    return this.prisma.mealOrder.count({ where: { kitchenId, status: 'PENDING' } });
  }

  countEaterNotices(kitchenId: string, seenAt: Date) {
    return this.prisma.mealOrder.count({
      where: {
        kitchenId,
        status: { in: ['ACCEPTED', 'REJECTED', 'COMPLETED'] },
        updatedAt: { gt: seenAt },
      },
    });
  }

  countNewRecords(kitchenId: string, seenAt: Date) {
    return this.prisma.mealRecord.count({
      where: { kitchenId, deletedAt: null, createdAt: { gt: seenAt } },
    });
  }
}
