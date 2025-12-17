import { GoogleGenerativeAI } from '@google/generative-ai';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { EmailEmbeddingsService } from 'src/emails/email-embeddings.service';
import { EmailsService } from '../emails/emails.service';
import { EmbeddingLevel } from 'src/emails/schemas/email-embedding.schema';

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

  async embedEmailIfNeeded(
    email: {
      emailId: string;
      subject?: string;
      snippet?: string;
      bodyText?: string;
      from?: string;
    },
    userId: string,
    mailboxId: string,
    level: EmbeddingLevel = EmbeddingLevel.SUMMARY,
  ) {
    if (
      level === EmbeddingLevel.SUMMARY &&
      (await this.emailEmbeddingsService.hasFullEmbedding(
        email.emailId,
        userId,
      ))
    ) {
      return;
    }

    const text =
      level === EmbeddingLevel.FULL
        ? this.buildFullEmailText(email)
        : this.buildSummaryEmailText(email);

    if (!text) return;

    const contentHash = this.hashContent(text);

    const existing = await this.emailEmbeddingsService.findByEmailId(
      email.emailId,
      userId,
    );

    if (
      existing &&
      existing.level === level &&
      existing.contentHash === contentHash
    ) {
      return;
    }

    const embedding = await this.embed(text);

    await this.emailEmbeddingsService.upsertEmbedding({
      emailId: email.emailId,
      userId,
      mailboxId,
      contentHash,
      embedding,
      model: 'text-embedding-004',
      level,
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

  private buildSummaryEmailText(email: any): string {
    return [
      email.from && `From: ${email.from}`,
      email.subject && `Subject: ${email.subject}`,
      email.snippet && `Snippet: ${email.snippet}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildFullEmailText(email: any): string {
    return [
      email.from && `From: ${email.from}`,
      email.subject && `Subject: ${email.subject}`,
      email.snippet && `Snippet: ${email.snippet}`,
      email.bodyText && `Body:\n${email.bodyText}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private hashContent(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (!a?.length || !b?.length) return 0;

    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (!magA || !magB) return 0;
    return dot / (magA * magB);
  }
}
