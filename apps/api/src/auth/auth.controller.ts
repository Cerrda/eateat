import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common';
import { raise } from '../common/http.js';
import { AuthService } from './auth.service.js';
import { SessionDto } from './dto/session.dto.js';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('session')
  create(@Body() dto: SessionDto, @Headers('x-eateat-wechat') wechat?: string) {
    if (wechat !== '1') {
      raise(HttpStatus.FORBIDDEN, 'WECHAT_REQUIRED', '用微信打开');
    }
    return this.auth.createSession(dto.clientKey);
  }
}
