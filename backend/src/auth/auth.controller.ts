import { Controller, Get, Post, Query, Req, Res, Body } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  getGoogleAuthUrl(@Res() res: any) {
    return res.redirect(this.authService.generateAuthUrl());
  }

  @Get('google/callback')
  async callback(
    @Query('code') code: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const user = await this.authService.loginWithGoogle(code);
    res.cookie('accessToken', user.accessToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const frontend_url = process.env.FRONTEND_URL || 'http://localhost:5173';
    console.log('Redirecting to frontend:', frontend_url);
    return res.redirect(frontend_url);
  }

  @Post('register')
  async register(@Body() createUserDto: { email: string; password: string }) {
    const user = await this.authService.register(createUserDto);
    return { success: true, data: user };
  }

  @Post('login')
  async login(
    @Body() loginUserDto: { email: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.authService.login(loginUserDto);
    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    res.cookie('accessToken', user.accessToken, {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    return res.json({ success: true, data: { email: user.email } });
  }

  @Get('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    const data = req['user'];
    const userId = data.id;
    await this.authService.logout(userId);
    console.log('Logging out user:', userId);
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.ENVIRONMENT === 'production',
      sameSite: process.env.ENVIRONMENT === 'production' ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ success: true, data: null });
  }
}
