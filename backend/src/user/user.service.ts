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
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UsersService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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

  async loginWithGoogleCredential(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email } = payload as { email: string };

    if (!email) {
      throw new UnauthorizedException('Google token invalid');
    }

    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = await this.userModel.create({
        email,
        password: randomBytes(16).toString('hex'), // tránh rỗng
        refreshToken: randomBytes(32).toString('hex'),
      });
    }

    // Tạo refreshToken mới
    const refreshToken = randomBytes(32).toString('hex');
    await this.userModel.updateOne({ _id: user._id }, { refreshToken });

    // Tạo access token
    const accessToken = await this.tokenService.createToken({ id: user._id });

    return {
      id: user._id,
      email: user.email,
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
