import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { randomBytes } from 'crypto';
import { TokenService } from 'src/token/token.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private tokenService: TokenService,
  ) {}

  async register(body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password)
      throw new BadRequestException('Email and password are required');

    const exists = await this.userModel.findOne({ email });
    if (exists) throw new ConflictException('Email already exists');

    const hashed = await bcryptjs.hash(password, 10);
    const refreshToken = randomBytes(32).toString('hex');
    const user = await this.userModel.create({
      email,
      password: hashed,
      refreshToken,
    });
    return {
      id: user._id,
      email: user.email,
      refreshToken,
      createdAt: user.createdAt,
    };
  }

  async login(body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password)
      throw new BadRequestException('Email and password are required');

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    const refreshToken = await this.getRefreshToken(user._id as string);
    const accessToken = await this.tokenService.createToken({ id: user._id });

    return {
      id: user._id,
      email: user.email,
      createdAt: user.createdAt,
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    const refreshToken = randomBytes(32).toString('hex');
    await this.userModel.updateOne({ _id: userId }, { refreshToken });
  }

  async getRefreshToken(userId: string) {
    const user = await this.userModel.findById(userId).select('refreshToken');
    if (!user) throw new NotFoundException('User not found');
    return user.refreshToken;
  }
  async getUserId(email: string) {
    const user = await this.userModel.findOne({ email }).select('_id');
    if (!user) throw new NotFoundException('User not found');
    return (user._id as string).toString();
  }

  async getUserInfo(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
