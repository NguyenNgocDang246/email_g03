import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  EmailEmbeddingDocument,
  EmailEmbeddingEntity,
} from './schemas/email-embedding.schema';
import { Model } from 'mongoose';

@Injectable()
export class EmailEmbeddingsService {
  constructor(
    @InjectModel(EmailEmbeddingEntity.name)
    private readonly model: Model<EmailEmbeddingDocument>,
  ) {}

  async findByEmailId(emailId: string, userId: string) {
    return this.model.findOne({ emailId, userId });
  }

  async upsertEmbedding(data: Partial<EmailEmbeddingEntity>) {
    return this.model.findOneAndUpdate(
      {
        emailId: data.emailId,
        userId: data.userId,
      },
      data,
      { upsert: true, new: true },
    );
  }

  async findAllByMailbox(userId: string, mailboxId: string) {
    return this.model.find({ userId, mailboxId });
  }
}
