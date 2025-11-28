import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { UsersService } from '../user/user.service';
import bcryptjs from 'bcryptjs';
import { randomBytes } from 'crypto';
@Injectable()
export class AuthService {
  private oauth2Client;

  constructor(
    private tokenService: TokenService,
    private usersService: UsersService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }
  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'email',
        'profile',
      ],
    });
  }

  async loginWithGoogle(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const gmailEmail = profile.data.emailAddress;
    if (!gmailEmail) throw new UnauthorizedException('Cannot get Gmail email');

    let user = await this.usersService.getUserByEmail(gmailEmail);
    if (!user) {
      user = await this.usersService.createUser(
        gmailEmail,
        randomBytes(16).toString('hex'),
        this.tokenService.createRefreshToken(),
      );
    }

    this.usersService.updateGoogleTokens(
      user._id as string,
      tokens.access_token || '',
      tokens.refresh_token || '',
    );

    const accessToken = await this.tokenService.createToken({ id: user._id });
    return {
      id: user._id,
      email: gmailEmail,
      accessToken,
      refreshToken: user.refreshToken,
    };
  }

  async register(body: { email: string; password: string }) {
    const { email, password } = body;
    if (!email || !password)
      throw new BadRequestException('Email and password are required');

    const exists = await this.usersService.getUserByEmail(email);
    if (exists) throw new ConflictException('Email already exists');

    const hashed = await bcryptjs.hash(password, 10);
    const refreshToken = randomBytes(32).toString('hex');
    const user = await this.usersService.createUser(
      email,
      hashed,
      refreshToken,
    );
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

    const user = await this.usersService.getUserByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcryptjs.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid password');

    const refreshToken = await this.usersService.getRefreshToken(
      user._id as string,
    );
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
    const refreshToken = this.tokenService.createRefreshToken();
    await this.usersService.updateRefreshToken(userId, refreshToken);
  }
}
