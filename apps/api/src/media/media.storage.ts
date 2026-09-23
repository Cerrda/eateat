import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

@Injectable()
export class MediaStorage {
  private readonly root =
    process.env.NODE_ENV === 'production'
      ? path.join(tmpdir(), 'eateat-storage')
      : path.resolve(process.cwd(), 'storage');

  async save(buffer: Buffer, ext: string): Promise<string> {
    await mkdir(this.root, { recursive: true });
    const name = `${randomBytes(16).toString('hex')}.${ext}`;
    await writeFile(path.join(this.root, name), buffer);
    return `/api/v1/media/${name}`;
  }

  resolve(name: string): string | null {
    if (!/^[a-f0-9]{32}\.(svg|jpg|png|webp|gif)$/.test(name)) {
      return null;
    }
    return path.join(this.root, name);
  }
}
