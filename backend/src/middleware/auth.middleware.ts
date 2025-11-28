import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../token/token.service';
import { UnauthorizedException } from '@nestjs/common/exceptions';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}
  use = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['accessToken'];
    if (!token) throw new UnauthorizedException('Token not provided');
    try {
      const decoded = await this.tokenService.validateToken(token);
      req['user'] = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  };
}
