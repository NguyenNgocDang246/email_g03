import { ConfigService } from '@nestjs/config';
import { EmailsService } from '../emails/emails.service';
import { GoogleGenAI } from '@google/genai';
import { EmailStatus } from '../emails/schemas/email.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { EmailEmbeddingsService } from '../emails/email-embeddings.service';
import { EmbeddingLevel } from '../emails/schemas/email-embedding.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: GoogleGenAI | null;
  private readonly modelName = 'gemini-2.5-flash';
  private genAI;

  constructor(
    @Inject(forwardRef(() => EmailsService))
    private readonly emailsService: EmailsService,
    private readonly configService: ConfigService,
    private readonly emailEmbeddingsService: EmailEmbeddingsService,
  ) {
    const apiKey = this.configService.get<string>('GG_API_KEY') || '';
    this.aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
    this.genAI = new GoogleGenerativeAI(apiKey);
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
    const text =
      level === EmbeddingLevel.FULL
        ? this.buildFullEmailText(email)
        : this.buildSummaryEmailText(email);

    if (!text) return;

    const contentHash = this.hashContent(text);

    const existing = await this.emailEmbeddingsService.findEmbedding(
      email.emailId,
      userId,
      level,
    );

    if (existing && existing.contentHash === contentHash) {
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

  async semanticSearch(
    mailboxId: string,
    query: string,
    userId: string,
    options?: { limit?: number; minScore?: number },
  ) {
    if (!query || !query.trim()) return [];

    const limit = options?.limit ?? 10;
    const minScore = options?.minScore ?? 0.3;

    const queryEmbedding = await this.embed(query.trim());

    if (!queryEmbedding.length) return [];

    const embeddings =
      await this.emailEmbeddingsService.findSummaryEmbeddingsByMailbox(
        userId,
        mailboxId,
      );

    if (!embeddings.length) return [];

    const scored: { emailId: string; score: number }[] = [];

    for (const item of embeddings) {
      if (!item.embedding || item.embedding.length !== queryEmbedding.length) {
        continue;
      }

      const score = this.cosineSimilarity(queryEmbedding, item.embedding);

      if (score >= minScore) {
        scored.push({
          emailId: item.emailId,
          score,
        });
      }
    }

    if (!scored.length) return [];

    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, limit);

    const emailIds = top.map((i) => i.emailId);

    const emails = await this.emailsService.findByEmailIds(
      userId,
      emailIds,
      mailboxId,
    );

    const emailMap = new Map(emails.map((e) => [e.id, e]));

    return top
      .map(({ emailId, score }) => {
        const email = emailMap.get(emailId);
        if (!email) return null;

        return {
          ...email,
          score,
        };
      })
      .filter(Boolean);
  }

  async summarizeEmail(emailId: string, userId: string, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = await this.emailsService.getCachedSummary(emailId, userId);
      if (cached) {
        return {
          summary: cached.summary || '',
          metadata: {
            sender: cached.sender,
            subject: cached.subject,
            date: cached.receivedAt
              ? new Date(cached.receivedAt).toISOString()
              : undefined,
            labels: cached.labels,
          },
          fullText: cached.fullText || '',
          status: cached.status,
        };
      }

      const cachedMeta = await this.emailsService.getCachedEmailMetadata(
        emailId,
        userId,
      );
      if (cachedMeta) {
        return {
          summary: '',
          metadata: {
            sender: cachedMeta.sender,
            subject: cachedMeta.subject,
            date: cachedMeta.receivedAt
              ? new Date(cachedMeta.receivedAt).toISOString()
              : undefined,
            labels: cachedMeta.labels,
          },
          fullText: '',
          status: cachedMeta.status,
        };
      }
    }

    const detail = await this.emailsService.getEmailDetail(emailId, userId);
    if (!detail) return null;

    const senderEmail = detail.from;
    const senderName = (detail as any)?.fromName;

    const baseText =
      detail.snippet ||
      detail.bodyText ||
      detail.bodyHtml?.replace(/<[^>]+>/g, '') ||
      '';

    const prompt = `You are an email assistant. Summarize this email in 80 words or less. Keep it concise and helpful.\n\nSubject: ${
      detail.subject || '(no subject)'
    }\nFrom: ${senderName ? `${senderName} <${senderEmail}>` : senderEmail}\nDate: ${
      detail.date ?? 'unknown'
    }\n\nEmail content:\n${baseText?.slice(0, 4000) || 'No content provided.'}`;

    const summary = await this.generateSummary(prompt, baseText);

    const metadata = {
      sender: senderEmail,
      senderName,
      subject: detail.subject,
      date: detail.date,
      mailboxId: detail.mailboxId,
    };

    const fullText = detail.bodyText || baseText || '';

    await this.emailsService.saveSummary(emailId, userId, summary, fullText, {
      from: senderEmail,
      subject: detail.subject,
      snippet: detail.snippet,
      date: detail.date,
      status: detail.status as EmailStatus,
    });

    return {
      summary,
      metadata,
      fullText,
      status: detail.status,
    };
  }

  private async generateSummary(prompt: string, fallback: string) {
    if (!this.aiClient) {
      this.logger.warn('GG_API_KEY is missing; falling back to snippet.');
      return (
        fallback?.slice(0, 280) ||
        'No content available to summarize for this email.'
      );
    }

    try {
      const response = await (this.aiClient as any).models.generateContent({
        model: this.modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text =
        (response as any)?.text ||
        (response as any)?.response?.candidates?.[0]?.content?.parts?.[0]
          ?.text ||
        '';

      if (text && typeof text === 'string') return text.trim();
    } catch (error) {
      this.logger.error(
        'Gemini summary failed',
        (error as Error)?.stack || String(error),
      );
    }

    return (
      fallback?.slice(0, 280) ||
      'No content available to summarize for this email.'
    );
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
