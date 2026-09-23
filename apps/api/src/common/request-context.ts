import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface RequestMember {
  id: string;
}

export interface RequestKitchen {
  membershipId: string;
  memberId: string;
  kitchenId: string;
  role: 'COOKER' | 'EATER';
  displayName: string;
  ordersSeenAt: Date;
  recordsSeenAt: Date;
}

export interface AppRequest extends Request {
  member?: RequestMember;
  kitchen?: RequestKitchen;
}

export const CurrentMember = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestMember => {
  const request = ctx.switchToHttp().getRequest<AppRequest>();
  if (!request.member) {
    throw new Error('member missing');
  }
  return request.member;
});

export const CurrentKitchen = createParamDecorator((_: unknown, ctx: ExecutionContext): RequestKitchen => {
  const request = ctx.switchToHttp().getRequest<AppRequest>();
  if (!request.kitchen) {
    throw new Error('kitchen missing');
  }
  return request.kitchen;
});
