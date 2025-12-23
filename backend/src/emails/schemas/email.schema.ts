import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailDocument = EmailEntity & Document;

export type EmailStatus =
  | 'INBOX'
  | 'TO_DO'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'SNOOZED';

@Schema({ timestamps: true })
export class EmailEntity {
  @Prop({ required: true, unique: true })
  emailId: string; // Gmail message id

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  sender: string;

  @Prop()
  subject: string;

  @Prop({ default: '' })
  snippet: string;

  @Prop({ required: true })
  receivedAt: Date;

  @Prop({ default: '' })
  summary?: string;

  @Prop({ default: '' })
  fullText?: string;

  @Prop({
    type: String,
    enum: ['INBOX', 'TO_DO', 'IN_PROGRESS', 'DONE', 'SNOOZED'],
    default: 'INBOX',
  })
  status: EmailStatus;

  @Prop({ type: Date, default: null })
  snoozedUntil?: Date | null;

  @Prop({
    type: String,
    enum: ['INBOX', 'TO_DO', 'IN_PROGRESS', 'DONE', 'SNOOZED'],
    default: null,
  })
  previousStatus?: EmailStatus | null;
}

export const EmailSchema = SchemaFactory.createForClass(EmailEntity);
