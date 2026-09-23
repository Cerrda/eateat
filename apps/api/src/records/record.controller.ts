import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentKitchen, type RequestKitchen } from '../common/request-context.js';
import { Roles } from '../kitchen/dto/kitchen.dto.js';
import { KitchenGuard } from '../kitchen/kitchen.guard.js';
import { RoleGuard } from '../kitchen/role.guard.js';
import { CreateRecordDto, UpdateRecordDto } from './dto/record.dto.js';
import { RecordService } from './record.service.js';

@Controller({ path: 'records', version: '1' })
@UseGuards(AuthGuard, KitchenGuard, RoleGuard)
export class RecordController {
  constructor(private readonly records: RecordService) {}

  @Get()
  list(@CurrentKitchen() kitchen: RequestKitchen) {
    return this.records.list(kitchen.kitchenId);
  }

  @Get(':id')
  get(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.records.get(kitchen.kitchenId, id);
  }

  @Post()
  @Roles('COOKER')
  create(@CurrentKitchen() kitchen: RequestKitchen, @Body() dto: CreateRecordDto) {
    return this.records.create(kitchen, dto);
  }

  @Patch(':id')
  @Roles('COOKER')
  update(
    @CurrentKitchen() kitchen: RequestKitchen,
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.records.update(kitchen, id, dto);
  }

  @Delete(':id')
  @Roles('COOKER')
  remove(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.records.remove(kitchen, id);
  }
}
