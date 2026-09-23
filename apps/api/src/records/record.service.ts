import { HttpStatus, Injectable } from '@nestjs/common';
import { RECORD_SLOT_RANK } from '../domain/order-rules.js';
import { graphemeLength } from '../domain/text.js';
import { raise } from '../common/http.js';
import type { RequestKitchen } from '../common/request-context.js';
import { DishRepository } from '../dishes/dish.repository.js';
import { decodeImage } from '../media/image-file.js';
import { MediaStorage } from '../media/media.storage.js';
import { OrderRepository } from '../orders/order.repository.js';
import type { CreateRecordDto, RecordPhotoDto, UpdateRecordDto } from './dto/record.dto.js';
import { RecordRepository, type RecordRow } from './record.repository.js';

@Injectable()
export class RecordService {
  constructor(
    private readonly records: RecordRepository,
    private readonly orders: OrderRepository,
    private readonly dishes: DishRepository,
    private readonly media: MediaStorage,
  ) {}

  async list(kitchenId: string) {
    const rows = await this.records.list(kitchenId);
    return { records: rows.map(presentRecord).sort(compareRecords) };
  }

  async get(kitchenId: string, id: string) {
    return presentRecord(await this.requireRecord(kitchenId, id));
  }

  async create(kitchen: RequestKitchen, dto: CreateRecordDto) {
    const body = (dto.body ?? '').trim();
    this.assertBody(body);
    const photos = dto.photos ?? [];
    if (!body && photos.length === 0) {
      raise(HttpStatus.BAD_REQUEST, 'RECORD_EMPTY', '照片和文字至少留一样');
    }
    this.assertDate(dto.mealDate);
    const dishIds = uniqueIds(dto.dishIds ?? []);
    const names = await this.dishNames(kitchen.kitchenId, dishIds);

    if (dto.orderId) {
      const order = await this.orders.find(kitchen.kitchenId, dto.orderId);
      if (!order || order.status !== 'COMPLETED') {
        raise(HttpStatus.CONFLICT, 'ORDER', '做完这一餐之后才能记下');
      }
      if (order.record && !order.record.deletedAt) {
        raise(HttpStatus.CONFLICT, 'RECORD_EXISTS', '这一餐已经记下了');
      }
    }

    const stored = await this.storePhotos(photos);
    try {
      const created = await this.records.transaction((tx) =>
        this.records.create(tx, {
          kitchenId: kitchen.kitchenId,
          orderId: dto.orderId ?? null,
          mealDate: dto.mealDate,
          slot: dto.slot,
          body,
          photos: stored,
          dishes: dishIds.map((id) => ({ dishId: id, nameSnapshot: names.get(id) ?? '' })),
        }),
      );
      return presentRecord(created);
    } catch (error) {
      if (isUnique(error)) {
        raise(HttpStatus.CONFLICT, 'RECORD_EXISTS', '这一餐已经记下了');
      }
      throw error;
    }
  }

  async update(kitchen: RequestKitchen, id: string, dto: UpdateRecordDto) {
    const current = await this.requireRecord(kitchen.kitchenId, id);
    const body = dto.body === undefined ? current.body : dto.body.trim();
    this.assertBody(body);
    const mealDate = dto.mealDate ?? current.mealDate;
    this.assertDate(mealDate);
    const slot = dto.slot ?? current.slot;
    const keepPhotoIds = dto.keepPhotoIds ?? current.photos.map((photo) => photo.id);
    const known = new Set(current.photos.map((photo) => photo.id));
    if (keepPhotoIds.some((photoId) => !known.has(photoId))) {
      raise(HttpStatus.BAD_REQUEST, 'PHOTO', '有一张照片已经不在了');
    }
    const added = await this.storePhotos(dto.addPhotos ?? []);
    if (keepPhotoIds.length + added.length > 9) {
      raise(HttpStatus.BAD_REQUEST, 'PHOTO', '最多 9 张照片');
    }
    if (!body && keepPhotoIds.length + added.length === 0) {
      raise(HttpStatus.BAD_REQUEST, 'RECORD_EMPTY', '照片和文字至少留一样');
    }

    const dishIds = dto.dishIds ? uniqueIds(dto.dishIds) : current.dishes.map((dish) => dish.dishId).filter((dishId): dishId is string => Boolean(dishId));
    const names = dto.dishIds
      ? await this.dishNames(kitchen.kitchenId, dishIds)
      : new Map(current.dishes.map((dish) => [dish.dishId ?? dish.id, dish.nameSnapshot]));

    const updated = await this.records.transaction((tx) =>
      this.records.replace(tx, id, {
        mealDate,
        slot,
        body,
        keepPhotoIds,
        photos: added,
        dishes: dishIds.map((dishId) => ({
          dishId,
          nameSnapshot: names.get(dishId) ?? '',
        })),
      }),
    );
    return presentRecord(updated);
  }

  async remove(kitchen: RequestKitchen, id: string) {
    await this.requireRecord(kitchen.kitchenId, id);
    await this.records.softDelete(id);
    return { ok: true };
  }

  private async requireRecord(kitchenId: string, id: string) {
    const record = await this.records.find(kitchenId, id);
    if (!record) raise(HttpStatus.NOT_FOUND, 'RECORD', '没有记下这一餐');
    return record;
  }

  private assertBody(body: string) {
    if (graphemeLength(body) > 300) {
      raise(HttpStatus.BAD_REQUEST, 'BODY', '文字最多 300 字');
    }
  }

  private assertDate(isoDate: string) {
    const [year, month, day] = isoDate.split('-').map(Number);
    const utc = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
    const real =
      utc.getUTCFullYear() === year && utc.getUTCMonth() === (month ?? 0) - 1 && utc.getUTCDate() === day;
    if (!real || year < 2020 || year > 2100) {
      raise(HttpStatus.BAD_REQUEST, 'DATE', '选一个日期');
    }
  }

  private async dishNames(kitchenId: string, ids: string[]) {
    const rows = await this.dishes.findAny(kitchenId, ids);
    if (rows.length !== ids.length) {
      raise(HttpStatus.BAD_REQUEST, 'DISH', '有一道菜不在这间厨房里');
    }
    return new Map(rows.map((dish) => [dish.id, dish.name]));
  }

  private async storePhotos(photos: RecordPhotoDto[]) {
    const stored: string[] = [];
    for (const photo of photos) {
      const image = decodeImage(photo.dataBase64, photo.mime);
      stored.push(await this.media.save(image.buffer, image.ext));
    }
    return stored;
  }
}

function presentRecord(record: RecordRow) {
  return {
    id: record.id,
    mealDate: record.mealDate,
    slot: record.slot,
    body: record.body,
    orderId: record.orderId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    photos: record.photos.map((photo) => ({ id: photo.id, path: photo.path })),
    dishes: record.dishes.map((dish) => ({
      id: dish.id,
      dishId: dish.dishId,
      name: dish.nameSnapshot,
    })),
  };
}

function compareRecords(
  a: { mealDate: string; slot: string; createdAt: string },
  b: { mealDate: string; slot: string; createdAt: string },
) {
  return (
    b.mealDate.localeCompare(a.mealDate) ||
    (RECORD_SLOT_RANK[a.slot] ?? 0) - (RECORD_SLOT_RANK[b.slot] ?? 0) ||
    b.createdAt.localeCompare(a.createdAt)
  );
}

function uniqueIds(ids: string[]): string[] {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (unique.length !== ids.filter(Boolean).length) {
    raise(HttpStatus.BAD_REQUEST, 'DISH_REPEAT', '同一道菜记一次就好');
  }
  return unique;
}

function isUnique(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}
