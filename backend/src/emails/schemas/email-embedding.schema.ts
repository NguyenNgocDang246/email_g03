import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailEmbeddingDocument = EmailEmbeddingEntity & Document;

export enum EmbeddingLevel {
  SUMMARY = 'SUMMARY',
  FULL = 'FULL',
}

@Schema({ timestamps: true })
export class EmailEmbeddingEntity {
  @Prop({ required: true, index: true })
  emailId: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  mailboxId: string;

  @Prop({ required: true })
  contentHash: string;

  @Prop({ type: [Number], required: true })
  embedding: number[];

  @Prop({ required: true })
  model: string;

  @Prop({
    type: String,
    enum: Object.values(EmbeddingLevel),
    default: EmbeddingLevel.SUMMARY,
    index: true,
  })
  level: EmbeddingLevel;
}

export const EmailEmbeddingSchema =
  SchemaFactory.createForClass(EmailEmbeddingEntity);
