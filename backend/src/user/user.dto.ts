import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { PickType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  refreshToken?: string;

  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export class LoginUserDto extends PickType(CreateUserDto, [
  'email',
  'password',
] as const) {}
