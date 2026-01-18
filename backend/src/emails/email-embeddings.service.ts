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

  async upsertEmbedding(data: EmailEmbeddingEntity) {
    return this.model.findOneAndUpdate(
      {
        emailId: data.emailId,
        userId: data.userId,
        level: data.level,
      },
      data,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  async findEmbedding(emailId: string, userId: string, level: EmbeddingLevel) {
    return this.model.findOne({ emailId, userId, level }).lean();
  }

  async findSummaryEmbeddingsByMailbox(userId: string, mailboxId: string) {
    return this.model
      .find({
        userId,
        mailboxId,
        level: EmbeddingLevel.SUMMARY,
      })
      .select({ emailId: 1, embedding: 1 })
      .lean();
  }

  async findAllSummaryEmbeddingsByUser(userId: string) {
    return this.model
      .find({
        userId,
        level: EmbeddingLevel.SUMMARY,
      })
      .select({ emailId: 1, embedding: 1 })
      .lean();
  }

  async deleteEmbeddingsByEmail(emailId: string, userId: string) {
    return this.model.deleteMany({ emailId, userId });
  }

  async deleteByMailbox(userId: string, mailboxId: string) {
    return this.model.deleteMany({ userId, mailboxId });
  }

  async updateMailboxIdForEmail(
    emailId: string,
    userId: string,
    newMailboxId: string,
  ) {
    return this.model.updateMany(
      { emailId, userId },
      { $set: { mailboxId: newMailboxId } },
    );
  }
}
