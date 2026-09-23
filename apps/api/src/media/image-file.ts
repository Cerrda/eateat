import { HttpStatus } from '@nestjs/common';
import { raise } from '../common/http.js';

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
} as const;

export type ImageMime = keyof typeof MIME_EXT;

export function decodeImage(dataBase64: string, mime: string): { buffer: Buffer; ext: string } {
  const ext = MIME_EXT[mime as ImageMime];
  if (!ext) {
    raise(HttpStatus.BAD_REQUEST, 'IMAGE_TYPE', '图片用 jpg、png、webp 或 gif');
  }

  const cleaned = dataBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
    raise(HttpStatus.BAD_REQUEST, 'IMAGE_DATA', '这张图读不出来，换一张再试');
  }

  const buffer = Buffer.from(cleaned, 'base64');
  if (buffer.length < 16 || buffer.length > 4_000_000) {
    raise(HttpStatus.BAD_REQUEST, 'IMAGE_SIZE', '这张图太大或是空的');
  }

  return { buffer, ext };
}
