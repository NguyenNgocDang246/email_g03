import {
  Get,
  Controller,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { UsersService } from '../user/user.service';
import { TokenService } from './token.service';
@Controller('token')
export class TokenController {
  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token not provided');
    const user = await this.userService.findUserByRefreshToken(refreshToken);
    if (!user) throw new UnauthorizedException('Invalid token');
    const id = user._id as string;

    const newAccessToken = await this.tokenService.createToken({ id });
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    return res.json({ success: true, data: null });
  }
}
