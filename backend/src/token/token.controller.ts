import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { UsersService } from '../user/user.service';
import { TokenService } from './token.service';
@Controller('token')
export class TokenController {
  constructor(
    private readonly userService: UsersService,
    private readonly tokenService: TokenService,
  ) {}
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string; email: string }) {
    const id = await this.userService.getUserId(body.email);
    const userRefreshToken = await this.userService.getRefreshToken(id);
    if (!userRefreshToken) throw new UnauthorizedException('Invalid token');
    if (userRefreshToken !== body.refreshToken)
      throw new UnauthorizedException('Invalid token');
    const newAccessToken = await this.tokenService.createToken({ id });
    return { success: true, data: { accessToken: newAccessToken } };
  }
}
