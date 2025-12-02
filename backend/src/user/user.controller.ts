import {
  Body,
  Req,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateUserDto, LoginUserDto } from './user.dto';
import { UsersService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body('credential') credential: string) {
    const user = await this.usersService.loginWithGoogleCredential(credential);
    return { success: true, data: user };
  }

  @Get('info')
  @HttpCode(HttpStatus.OK)
  async info(@Req() req: Request) {
    const data = req['user'];
    const user = await this.usersService.getUserInfo(data.id);
    return { success: true, data: user };
  }
}
