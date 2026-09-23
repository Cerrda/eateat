import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { KitchenController } from './kitchen.controller.js';
import { KitchenGuard } from './kitchen.guard.js';
import { KitchenRepository } from './kitchen.repository.js';
import { KitchenService } from './kitchen.service.js';
import { RoleGuard } from './role.guard.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [KitchenController],
  providers: [KitchenService, KitchenRepository, KitchenGuard, RoleGuard],
  exports: [KitchenGuard, RoleGuard, KitchenRepository, KitchenService],
})
export class KitchenModule {}
