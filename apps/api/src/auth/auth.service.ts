import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AuthRepository } from './auth.repository.js';

@Injectable()
export class AuthService {
  constructor(private readonly auth: AuthRepository) {}

  async createSession(clientKey: string) {
    const member = await this.auth.upsertMember(clientKey);
    const token = randomBytes(32).toString('hex');
    const session = await this.auth.replaceSession(member.id, token);
    return { token: session.token, memberId: session.memberId };
  }
}
