import {
  Body,
  Req,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
} from '@nestjs/common';
import { CreateUserDto, LoginUserDto } from './user.dto';
import { UsersService } from './user.service';

@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.register(createUserDto);
    return { success: true, data: user };
  }
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.usersService.login(loginUserDto);
    return { success: true, data: user };
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { userId: string }) {
    await this.usersService.logout(body.userId);
    return { success: true, data: null };
  }
  @Get('info')
  @HttpCode(HttpStatus.OK)
  async info(@Req() req: Request) {
    const data = req['user'];
    const user = await this.usersService.getUserInfo(data.id);
    return { success: true, data: user };
  }
}
