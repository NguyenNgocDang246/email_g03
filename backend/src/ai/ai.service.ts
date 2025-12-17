import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailsService } from '../emails/emails.service';
import { MailboxesService } from '../mailboxes/mailboxes.service';
import { GoogleGenAI } from '@google/genai';
import { EmailStatus } from '../emails/email.schema';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private aiClient: GoogleGenAI | null;
  private readonly modelName = 'gemini-2.5-flash';

  constructor(
    private readonly emailsService: EmailsService,
    private readonly mailboxesService: MailboxesService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GG_API_KEY');
    this.aiClient = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async semanticSearch(
    mailboxId: string | undefined,
    query: string,
    userId: string,
  ) {
    if (!query) return [];
    if (!mailboxId) return [];

    const results = await this.mailboxesService.searchEmailsInMailbox(
      mailboxId,
      query,
      { limit: 50, pageToken: 1 } as any,
      userId,
    );
    return results.data || [];
  }

  async summarizeEmail(emailId: string, userId: string, forceRefresh = false) {
    const detail = await this.emailsService.getEmailDetail(emailId, userId);
    if (!detail) return null;

    if (!forceRefresh) {
      const cached = await this.emailsService.getCachedSummary(emailId, userId);
      if (cached?.summary) {
        return {
          summary: cached.summary,
          metadata: {
            sender: detail.from,
            senderName: (detail as any)?.fromName,
            subject: detail.subject,
            date: detail.date,
            mailboxId: detail.mailboxId,
          },
          fullText: cached.fullText,
          status: cached.status || detail.status,
        };
      }
    }

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
}
