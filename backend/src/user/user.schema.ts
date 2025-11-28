import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  refreshToken: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: null })
  googleAccessToken: string;

  @Prop({ default: null })
  googleRefreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
