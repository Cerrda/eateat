import { HttpStatus, Injectable } from '@nestjs/common';
import { shanghaiDayStart } from '../domain/calendar.js';
import { renderDishCover } from '../domain/cover-art.js';
import { normalizeSteps, publishBlockers } from '../domain/dish-rules.js';
import { canRequestParse, classifyRecipeUrl } from '../domain/links.js';
import { graphemeLength } from '../domain/text.js';
import { raise } from '../common/http.js';
import type { RequestKitchen } from '../common/request-context.js';
import { decodeImage } from '../media/image-file.js';
import { MediaStorage } from '../media/media.storage.js';
import type { CoverUploadDto, DishDto } from './dto/dish.dto.js';
import { DishRepository, type DishRecord } from './dish.repository.js';
import { presentDish, presentMenuDish, readSteps } from './dish.presenter.js';
import { LinkImportService } from './link-import.service.js';

@Injectable()
export class DishService {
  constructor(
    private readonly dishes: DishRepository,
    private readonly links: LinkImportService,
    private readonly media: MediaStorage,
  ) {}

  async list(kitchen: RequestKitchen) {
    const rows = await this.dishes.list(kitchen.kitchenId);
    return { dishes: await Promise.all(rows.map((dish) => this.withMeta(dish, true))) };
  }

  async menu(kitchenId: string) {
    const rows = await this.dishes.menu(kitchenId);
    return { dishes: rows.map(presentMenuDish) };
  }

  async get(kitchen: RequestKitchen, id: string) {
    const dish = await this.requireDish(kitchen.kitchenId, id);
    return this.withMeta(dish, true);
  }

  async menuItem(kitchenId: string, id: string) {
    const dish = await this.dishes.findInKitchen(kitchenId, id);
    if (!dish || dish.status !== 'PUBLISHED') {
      raise(HttpStatus.NOT_FOUND, 'DISH', '菜单里没有这道菜');
    }
    return presentMenuDish(dish);
  }

  async create(kitchen: RequestKitchen, dto: DishDto) {
    const data = this.fields(dto);
    const dish = await this.dishes.create(kitchen.kitchenId, { ...data, status: 'DRAFT' });
    return this.withMeta(dish, true);
  }

  async update(kitchen: RequestKitchen, id: string, dto: DishDto) {
    await this.requireDish(kitchen.kitchenId, id);
    const dish = await this.dishes.update(id, this.fields(dto));
    return this.withMeta(dish, true);
  }

  async publish(kitchen: RequestKitchen, id: string) {
    const dish = await this.requireDish(kitchen.kitchenId, id);
    const blockers = publishBlockers({
      name: dish.name,
      summary: dish.summary,
      steps: readSteps(dish.steps),
      coverPath: dish.coverPath,
    });
    if (blockers.length > 0) {
      raise(HttpStatus.BAD_REQUEST, 'PUBLISH_BLOCKED', blockers.join('，'));
    }
    const published = await this.dishes.setStatus(id, 'PUBLISHED', new Date());
    return this.withMeta(published, true);
  }

  async unpublish(kitchen: RequestKitchen, id: string) {
    const dish = await this.requireDish(kitchen.kitchenId, id);
    if (dish.status !== 'PUBLISHED') {
      raise(HttpStatus.CONFLICT, 'NOT_PUBLISHED', '这道菜还没上架');
    }
    const updated = await this.dishes.setStatus(id, 'UNPUBLISHED', dish.publishedAt);
    return this.withMeta(updated, true);
  }

  async remove(kitchen: RequestKitchen, id: string) {
    await this.requireDish(kitchen.kitchenId, id);
    const blocking = await this.dishes.countBlockingOrders(id);
    if (blocking > 0) {
      raise(HttpStatus.CONFLICT, 'DISH_IN_USE', '这道菜还在待接单或已接单里，只能下架。');
    }
    await this.dishes.softDelete(id);
    return { ok: true };
  }

  async importLink(kitchen: RequestKitchen, url: string) {
    const kind = classifyRecipeUrl(url);
    if (!canRequestParse(kind)) {
      raise(HttpStatus.BAD_REQUEST, 'LINK_UNSUPPORTED', '只能用小红书或抖音，可以改为自己写');
    }

    const recipe = await this.links.read(url);
    if (!recipe || graphemeLength(recipe.name) < 1) {
      return {
        parsed: false,
        message: '这条没解析出来，可以直接写',
        sourceUrl: url,
        draft: null,
      };
    }

    const dish = await this.dishes.create(kitchen.kitchenId, {
      name: recipe.name,
      summary: recipe.summary,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      durationMinutes: recipe.durationMinutes,
      sourceUrl: url,
      status: 'DRAFT',
    });
    return {
      parsed: true,
      message: '',
      sourceUrl: url,
      draft: await this.withMeta(dish, true),
    };
  }

  async generateCover(kitchen: RequestKitchen, id: string) {
    const dish = await this.requireDish(kitchen.kitchenId, id);
    const used = await this.dishes.countCoversSince(id, shanghaiDayStart());
    if (used >= 5) {
      raise(HttpStatus.TOO_MANY_REQUESTS, 'COVER_LIMIT', '今天这道菜的封面已经生成 5 次，可以改为上传。');
    }

    try {
      const svg = renderDishCover(`${dish.name}\n${dish.summary}\n${dish.ingredients}`);
      const imagePath = await this.media.save(Buffer.from(svg), 'svg');
      const attempt = await this.dishes.addCover(id, 'READY', imagePath);
      return { ...attempt, coversRemaining: Math.max(0, 4 - used) };
    } catch (error) {
      console.error('cover-generate-failed', error);
      const attempt = await this.dishes.addCover(id, 'FAILED', null);
      return { ...attempt, coversRemaining: Math.max(0, 4 - used) };
    }
  }

  async adoptCover(kitchen: RequestKitchen, id: string, attemptId: string) {
    await this.requireDish(kitchen.kitchenId, id);
    const attempt = await this.dishes.findCover(id, attemptId);
    if (!attempt || attempt.status !== 'READY' || !attempt.imagePath) {
      raise(HttpStatus.BAD_REQUEST, 'COVER', '还没有可以选用的封面');
    }
    const [, , dish] = await this.dishes.transaction((tx) =>
      this.dishes.adopt(tx, id, attemptId, attempt.imagePath as string),
    );
    return this.withMeta(dish, true);
  }

  async uploadCover(kitchen: RequestKitchen, id: string, dto: CoverUploadDto) {
    await this.requireDish(kitchen.kitchenId, id);
    const image = decodeImage(dto.dataBase64, dto.mime);
    const imagePath = await this.media.save(image.buffer, image.ext);
    const dish = await this.dishes.update(id, { coverPath: imagePath });
    return this.withMeta(dish, true);
  }

  private fields(dto: DishDto) {
    const name = dto.name.trim();
    if (graphemeLength(name) < 1 || graphemeLength(name) > 20) {
      raise(HttpStatus.BAD_REQUEST, 'NAME', '菜名最多 20 字');
    }
    const summary = (dto.summary ?? '').trim();
    if (graphemeLength(summary) > 80) {
      raise(HttpStatus.BAD_REQUEST, 'SUMMARY', '简介最多 80 字');
    }
    const steps = normalizeSteps(dto.steps);
    if (steps.some((step) => graphemeLength(step) > 200)) {
      raise(HttpStatus.BAD_REQUEST, 'STEPS', '每一步最多 200 字');
    }
    return {
      name,
      summary,
      ingredients: (dto.ingredients ?? '').trim(),
      steps,
      durationMinutes: dto.durationMinutes ?? null,
      servings: (dto.servings ?? '').trim(),
      sourceUrl: dto.sourceUrl?.trim() || null,
    };
  }

  private async requireDish(kitchenId: string, id: string) {
    const dish = await this.dishes.findInKitchen(kitchenId, id);
    if (!dish) raise(HttpStatus.NOT_FOUND, 'DISH', '没有这道菜');
    return dish;
  }

  private async withMeta(dish: DishRecord, includeSource: boolean) {
    const [used, candidate] = await Promise.all([
      this.dishes.countCoversSince(dish.id, shanghaiDayStart()),
      this.dishes.latestCover(dish.id),
    ]);
    return presentDish(dish, used, candidate, includeSource);
  }
}
