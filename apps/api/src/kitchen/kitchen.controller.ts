import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentMember } from '../common/request-context.js';
import {
  CreateKitchenDto,
  JoinDto,
  RenameDto,
  SeenDto,
} from './dto/kitchen.dto.js';
import { KitchenService } from './kitchen.service.js';

@Controller({ version: '1' })
@UseGuards(AuthGuard)
export class KitchenController {
  constructor(private readonly kitchens: KitchenService) {}

  @Get('me')
  me(@CurrentMember() member: { id: string }) {
    return this.kitchens.me(member.id);
  }

  @Patch('me/name')
  rename(@CurrentMember() member: { id: string }, @Body() dto: RenameDto) {
    return this.kitchens.rename(member.id, dto.displayName);
  }

  @Post('me/seen')
  seen(@CurrentMember() member: { id: string }, @Body() dto: SeenDto) {
    return this.kitchens.seen(member.id, dto.surface);
  }

  @Post('kitchens')
  create(@CurrentMember() member: { id: string }, @Body() dto: CreateKitchenDto) {
    return this.kitchens.create(member.id, dto.role);
  }

  @Post('kitchens/invite/refresh')
  refresh(@CurrentMember() member: { id: string }) {
    return this.kitchens.refreshInvite(member.id);
  }

  @Post('kitchens/unbind')
  unbind(@CurrentMember() member: { id: string }) {
    return this.kitchens.unbind(member.id);
  }

  @Get('invites/:code')
  preview(@CurrentMember() member: { id: string }, @Param('code') code: string) {
    return this.kitchens.preview(member.id, code);
  }

  @Post('invites/:code/join')
  join(
    @CurrentMember() member: { id: string },
    @Param('code') code: string,
    @Body() dto: JoinDto,
  ) {
    return this.kitchens.join(member.id, code, dto.abandon === true);
  }
}
