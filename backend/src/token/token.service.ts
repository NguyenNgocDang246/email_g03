import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}
  async createToken(payload: any): Promise<string> {
    return await this.jwtService.signAsync(payload);
  }
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verifyAsync(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
