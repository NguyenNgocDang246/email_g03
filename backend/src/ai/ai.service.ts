import { GoogleGenerativeAI } from '@google/generative-ai';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EmailEmbeddingsService } from 'src/emails/email-embeddings.service';
import { EmailsService } from '../emails/emails.service';

@Injectable()
export class AiService {
  private genAI;

  constructor(
    @Inject(forwardRef(() => EmailsService))
    private readonly emailsService: EmailsService,
    private readonly configService: ConfigService,
    private readonly emailEmbeddingsService: EmailEmbeddingsService,
  ) {
    this.genAI = new GoogleGenerativeAI(
      this.configService.get<string>('GG_API_KEY') || '',
    );
  }

  private async embed(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });

    const result = await model.embedContent(text);

    return result.embedding.values;
  }

  async embedEmailIfNeeded(email: any, userId: string, mailboxId: string) {
    console.log('🔥 EMBED CALLED FOR EMAIL:', email.emailId);
    const text = this.buildEmailText(email);
    if (!text) return;

    const hash = this.hashContent(text);

    const existing = await this.emailEmbeddingsService.findByEmailId(
      email.emailId,
      userId,
    );

    if (existing && existing.contentHash === hash) return;

    const embedding = await this.embed(text);

    await this.emailEmbeddingsService.upsertEmbedding({
      emailId: email.emailId,
      userId,
      mailboxId,
      contentHash: hash,
      embedding,
      model: 'text-embedding-004',
    });
  }

  async semanticSearch(mailboxId: string, query: string, userId: string) {
    if (!query?.trim()) return [];

    const queryEmbedding = await this.embed(query);

    const embeddings = await this.emailEmbeddingsService.findAllByMailbox(
      userId,
      mailboxId,
    );

    const scored = embeddings.map((item) => ({
      emailId: item.emailId,
      score: this.cosineSimilarity(queryEmbedding, item.embedding),
    }));

    scored.sort((a, b) => b.score - a.score);

    const topIds = scored.slice(0, 10).map((i) => i.emailId);

    return this.emailsService.findByEmailIds(userId, topIds, mailboxId);
  }

  async summarizeEmail(emailId: string, userId: string) {
    const detail = await this.emailsService.getEmailDetail(emailId, userId);
    if (!detail) return null;

    const senderEmail = detail.from;
    const senderName = (detail as any)?.fromName;

    const baseText =
      detail.snippet ||
      detail.bodyText ||
      detail.bodyHtml?.replace(/<[^>]+>/g, '') ||
      '';

    const summary =
      baseText?.slice(0, 280) ||
      'No content available to summarize for this email.';

    return {
      summary,
      metadata: {
        sender: senderEmail,
        senderName,
        subject: detail.subject,
        date: detail.date,
        mailboxId: detail.mailboxId,
      },
      fullText: detail.bodyText,
      status: detail.status,
    };
  }

  private buildEmailText(email: any): string {
    return `
Subject: ${email.subject || ''}
From: ${email.sender || email.from || ''}
Content:
${email.bodyText || email.snippet || ''}
    `.trim();
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length) return 0;

    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return dot / (magA * magB);
  }
}
