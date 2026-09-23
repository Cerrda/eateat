import { Module } from '@nestjs/common';
import { MediaController } from './media.controller.js';
import { MediaStorage } from './media.storage.js';

@Module({
  controllers: [MediaController],
  providers: [MediaStorage],
  exports: [MediaStorage],
})
export class MediaModule {}
