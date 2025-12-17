import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type EmailEmbeddingDocument = EmailEmbeddingEntity & Document;

@Schema({ timestamps: true })
export class EmailEmbeddingEntity {
  @Prop({ required: true, index: true })
  emailId: string; // Gmail message id

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  mailboxId: string;

  @Prop({ required: true })
  contentHash: string; // detect content change

  @Prop({ type: [Number], required: true })
  embedding: number[]; // OpenAI vector

  @Prop({ required: true })
  model: string; // text-embedding-3-small
}

export const EmailEmbeddingSchema =
  SchemaFactory.createForClass(EmailEmbeddingEntity);
