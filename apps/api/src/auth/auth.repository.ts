import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsertMember(clientKey: string) {
    return this.prisma.member.upsert({
      where: { clientKey },
      create: { clientKey },
      update: {},
      select: { id: true },
    });
  }

  replaceSession(memberId: string, token: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { memberId } });
      return tx.session.create({
        data: { memberId, token },
        select: { token: true, memberId: true },
      });
    });
  }

  findMemberByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
      select: { member: { select: { id: true } } },
    });
  }
}
