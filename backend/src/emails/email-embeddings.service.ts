import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EmailEmbeddingDocument,
  EmailEmbeddingEntity,
  EmbeddingLevel,
} from './schemas/email-embedding.schema';

@Injectable()
export class EmailEmbeddingsService {
  constructor(
    @InjectModel(EmailEmbeddingEntity.name)
    private readonly model: Model<EmailEmbeddingDocument>,
  ) {}

  async findByEmailId(
    emailId: string,
    userId: string,
    level?: 'SUMMARY' | 'FULL',
  ) {
    return this.model.findOne({
      emailId,
      userId,
      ...(level ? { level } : {}),
    });
  }

  async upsertEmbedding(data: EmailEmbeddingEntity) {
    return this.model.findOneAndUpdate(
      {
        emailId: data.emailId,
        userId: data.userId,
        level: data.level,
      },
      data,
      { upsert: true, new: true },
    );
  }

  async findAllByMailbox(userId: string, mailboxId: string) {
    return this.model.find({ userId, mailboxId }).lean();
  }

  async hasFullEmbedding(emailId: string, userId: string): Promise<boolean> {
    const count = await this.model.countDocuments({
      emailId,
      userId,
      level: EmbeddingLevel.FULL,
    });

    return count > 0;
  }
}
