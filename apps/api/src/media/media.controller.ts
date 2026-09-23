import { Controller, Get, Header, Param, Res, StreamableFile } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import type { Response } from 'express';
import { HttpStatus } from '@nestjs/common';
import { raise } from '../common/http.js';
import { MediaStorage } from './media.storage.js';

const TYPES: Record<string, string> = {
  svg: 'image/svg+xml',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly storage: MediaStorage) {}

  @Get(':name')
  @Header('X-Content-Type-Options', 'nosniff')
  @Header('Cache-Control', 'public, max-age=86400')
  async show(@Param('name') name: string, @Res({ passthrough: true }) response: Response) {
    const filePath = this.storage.resolve(name);
    if (!filePath) {
      raise(HttpStatus.NOT_FOUND, 'MEDIA', '没有这张图');
    }

    try {
      await access(filePath);
    } catch {
      raise(HttpStatus.NOT_FOUND, 'MEDIA', '没有这张图');
    }

    const ext = name.split('.').pop() ?? '';
    response.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
    return new StreamableFile(createReadStream(filePath));
  }
}
