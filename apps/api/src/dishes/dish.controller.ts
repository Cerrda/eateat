import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard.js';
import { CurrentKitchen, type RequestKitchen } from '../common/request-context.js';
import { KitchenGuard } from '../kitchen/kitchen.guard.js';
import { Roles } from '../kitchen/dto/kitchen.dto.js';
import { RoleGuard } from '../kitchen/role.guard.js';
import { CoverUploadDto, DishDto, ImportLinkDto } from './dto/dish.dto.js';
import { DishService } from './dish.service.js';

@Controller({ version: '1' })
@UseGuards(AuthGuard, KitchenGuard, RoleGuard)
export class DishController {
  constructor(private readonly dishes: DishService) {}

  @Get('dishes')
  @Roles('COOKER')
  list(@CurrentKitchen() kitchen: RequestKitchen) {
    return this.dishes.list(kitchen);
  }

  @Post('dishes/import')
  @Roles('COOKER')
  importLink(@CurrentKitchen() kitchen: RequestKitchen, @Body() dto: ImportLinkDto) {
    return this.dishes.importLink(kitchen, dto.url);
  }

  @Post('dishes')
  @Roles('COOKER')
  create(@CurrentKitchen() kitchen: RequestKitchen, @Body() dto: DishDto) {
    return this.dishes.create(kitchen, dto);
  }

  @Get('dishes/:id')
  @Roles('COOKER')
  get(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.get(kitchen, id);
  }

  @Patch('dishes/:id')
  @Roles('COOKER')
  update(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string, @Body() dto: DishDto) {
    return this.dishes.update(kitchen, id, dto);
  }

  @Post('dishes/:id/publish')
  @Roles('COOKER')
  publish(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.publish(kitchen, id);
  }

  @Post('dishes/:id/unpublish')
  @Roles('COOKER')
  unpublish(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.unpublish(kitchen, id);
  }

  @Delete('dishes/:id')
  @Roles('COOKER')
  remove(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.remove(kitchen, id);
  }

  @Post('dishes/:id/covers')
  @Roles('COOKER')
  generate(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.generateCover(kitchen, id);
  }

  @Post('dishes/:id/covers/:attemptId/adopt')
  @Roles('COOKER')
  adopt(
    @CurrentKitchen() kitchen: RequestKitchen,
    @Param('id') id: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.dishes.adoptCover(kitchen, id, attemptId);
  }

  @Post('dishes/:id/cover')
  @Roles('COOKER')
  upload(
    @CurrentKitchen() kitchen: RequestKitchen,
    @Param('id') id: string,
    @Body() dto: CoverUploadDto,
  ) {
    return this.dishes.uploadCover(kitchen, id, dto);
  }

  @Get('menu')
  menu(@CurrentKitchen() kitchen: RequestKitchen) {
    return this.dishes.menu(kitchen.kitchenId);
  }

  @Get('menu/:id')
  menuItem(@CurrentKitchen() kitchen: RequestKitchen, @Param('id') id: string) {
    return this.dishes.menuItem(kitchen.kitchenId, id);
  }
}
