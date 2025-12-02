import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import bcryptjs from 'bcryptjs';
import { User, UserDocument } from './user.schema';
import { randomBytes } from 'crypto';
import { TokenService } from '../token/token.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UsersService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private tokenService: TokenService,
  ) {}

  async loginWithGoogleCredential(credential: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email } = payload as { email: string };

    if (!email) {
      // throw new UnauthorizedException('Google token invalid');
      return null;
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

  async createUser(email: string, password: string, refreshToken: string) {
    const user = await this.userModel.create({ email, password, refreshToken });
    return user;
  }

  async getRefreshToken(userId: string) {
    const user = await this.userModel.findById(userId).select('refreshToken');
    if (!user) return null;
    return user.refreshToken;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    await this.userModel.updateOne({ _id: userId }, { refreshToken });
  }

  async findUserByRefreshToken(refreshToken: string) {
    const user = await this.userModel.findOne({ refreshToken });
    return user;
  }

  async updateGoogleTokens(
    userId: string,
    googleAccessToken: string,
    googleRefreshToken: string,
  ) {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { googleRefreshToken, googleAccessToken } },
      { upsert: true },
    );
  }

  async getUserByEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    return user;
  }

  async getUserInfo(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('-password -refreshToken');
    return user;
  }

  async getGoogleTokens(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('googleAccessToken googleRefreshToken');
    return user;
  }
}
