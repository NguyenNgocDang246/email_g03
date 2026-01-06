import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EmailEmbeddingDocument = EmailEmbeddingEntity & Document;

export enum EmbeddingLevel {
  SUMMARY = 'SUMMARY',
  FULL = 'FULL',
}

@Schema({
  timestamps: true,
})
export class EmailEmbeddingEntity {
  @Prop({ required: true })
  emailId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
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
    required: true,
    default: EmbeddingLevel.SUMMARY,
  })
  level: EmbeddingLevel;
}

export const EmailEmbeddingSchema =
  SchemaFactory.createForClass(EmailEmbeddingEntity);

EmailEmbeddingSchema.index(
  { userId: 1, emailId: 1, level: 1 },
  { unique: true },
);

EmailEmbeddingSchema.index({ userId: 1, mailboxId: 1, level: 1 });
