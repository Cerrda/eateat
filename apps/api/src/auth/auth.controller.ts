import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SessionDto } from './dto/session.dto.js';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('session')
  create(@Body() dto: SessionDto) {
    return this.auth.createSession(dto.clientKey);
  }
}
