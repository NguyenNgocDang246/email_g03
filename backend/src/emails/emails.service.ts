import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EmailEntity, EmailStatus } from './schemas/email.schema';
import { Model, type AnyBulkWriteOperation } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { EmailDetailMapper, GmailMapper } from '../mappers';
import { AiService } from '../ai/ai.service';
import { EmbeddingLevel } from './schemas/email-embedding.schema';

@Injectable()
export class EmailsService {
  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    @InjectModel(EmailEntity.name)
    private emailModel: Model<EmailEntity>,
  ) {}

  async getEmailDetail(id: string, userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const emailDetail = await gmail.users.messages.get({
      userId: 'me',
      id: id,
      format: 'full',
    });

    const emailDetailMapped = EmailDetailMapper.toEmailDetail(
      emailDetail.data,
      undefined,
    );

    const statusDoc = await this.emailModel
      .findOne({ userId, emailId: id })
      .lean();
    if (!statusDoc) {
      await this.emailModel.create({
        emailId: id,
        userId,
        sender: emailDetailMapped.from,
        subject: emailDetailMapped.subject,
        snippet: emailDetailMapped.snippet ?? '',
        receivedAt: emailDetailMapped.date
          ? new Date(emailDetailMapped.date)
          : new Date(),
        status: 'INBOX',
      });
    }

    if (emailDetailMapped?.bodyText || emailDetailMapped?.snippet) {
      await this.aiService.embedEmailIfNeeded(
        {
          emailId: id,
          subject: emailDetailMapped.subject,
          bodyText: emailDetailMapped.bodyText,
          snippet: emailDetailMapped.snippet,
          from: emailDetailMapped.from,
        },
        userId,
        'INBOX',
        EmbeddingLevel.FULL,
      );
    }

    emailDetailMapped.status = statusDoc?.status ?? 'INBOX';

    return emailDetailMapped;
  }

  async findByEmailIds(userId: string, emailIds: string[], mailboxId?: string) {
    const gmail = await this.authService.getGmail(userId);

    // Fetch stored statuses from DB to merge later
    const stored = await this.emailModel
      .find({ userId, emailId: { $in: emailIds } })
      .lean();
    const storedMap = new Map(stored.map((s) => [s.emailId, s]));

    if (!gmail) {
      return emailIds.map((id) => ({
        id,
        mailboxId: mailboxId || '',
        from: storedMap.get(id)?.sender || '',
        subject: storedMap.get(id)?.subject || '',
        snippet: storedMap.get(id)?.snippet || '',
        date: storedMap.get(id)?.receivedAt
          ? new Date(storedMap.get(id)!.receivedAt).toISOString()
          : new Date().toISOString(),
        isRead: false,
        labels: undefined,
        status: (storedMap.get(id)?.status as any) || 'INBOX',
      }));
    }

    const responses = await Promise.all(
      emailIds.map((id) =>
        gmail.users.messages.get({ userId: 'me', id, format: 'full' }),
      ),
    );

    const mapped = responses.map((r) =>
      GmailMapper.toEmail(r.data as any, mailboxId || ''),
    );

    return mapped.map((m) => ({
      id: m.id,
      mailboxId: m.mailboxId,
      from: m.from,
      subject: m.subject,
      snippet: m.snippet,
      date: m.date,
      isRead: m.isRead,
      labels: m.labels,
      status: (storedMap.get(m.id)?.status as any) || 'INBOX',
    }));
  }

  buildMimeEmail(to: string, subject: string, html: string) {
    const mime = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\n');

    // Base64 → chuẩn base64url
    return Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendEmail(userId: string, { to, subject, html }) {
    const raw = this.buildMimeEmail(to, subject, html);
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });

    return {
      message: 'Email sent!',
      id: res.data.id,
    };
  }

  buildReplyMime({ to, subject, html, messageIdHeader, referencesHeader }) {
    let references = messageIdHeader;
    if (referencesHeader && referencesHeader.trim().length) {
      references = referencesHeader.trim() + ' ' + messageIdHeader;
    }

    const mime = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${references}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ].join('\n');

    const raw = Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return raw;
  }

  async replyEmail(
    userId: string,
    { to, subject, html },
    threadId: string,
    messageIdHeader: string,
    referencesHeader?: string,
  ) {
    const raw = this.buildReplyMime({
      to,
      subject,
      html,
      messageIdHeader,
      referencesHeader,
    });
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId },
    });

    return {
      message: 'Email replied!',
      id: res.data.id,
    };
  }

  async modifyEmailLabels(
    userId: string,
    messageId: string,
    addLabels: string[],
    removeLabels: string[],
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;
    if (addLabels.length === 0 && removeLabels.length === 0) {
      return null;
    }
    const res = await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: addLabels,
        removeLabelIds: removeLabels,
      },
    });
  }

  async streamAttachment(
    userId: string,
    messageId: string,
    attachmentId: string,
  ) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) throw new NotFoundException('Gmail not found');

    const attachment = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: messageId,
      id: attachmentId,
    });

    if (!attachment?.data?.data) {
      throw new NotFoundException('Attachment content not found');
    }

    return attachment.data.data;
  }

  private async unsnoozeExpired(userId: string) {
    const now = new Date();
    const expired = await this.emailModel
      .find({
        userId,
        status: 'SNOOZED',
        snoozedUntil: { $lte: now },
      })
      .lean();

    if (!expired.length) return;
    const ops: AnyBulkWriteOperation<EmailEntity>[] = expired.map((doc) => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: {
            status: doc.previousStatus || 'INBOX',
          },
          $unset: { snoozedUntil: '', previousStatus: '' },
        },
      },
    }));
    await this.emailModel.bulkWrite(ops);
  }

  async saveEmailSummaries(
    userId: string,
    emails: {
      id: string;
      from: string;
      subject: string;
      snippet: string;
      date: string;
    }[],
  ) {
    if (!emails.length) return;

    const ops: AnyBulkWriteOperation<EmailEntity>[] = emails.map((mail) => ({
      updateOne: {
        filter: { userId, emailId: mail.id },
        update: {
          $setOnInsert: {
            emailId: mail.id,
            userId,
            sender: mail.from,
            subject: mail.subject,
            snippet: mail.snippet ?? '',
            receivedAt: mail.date ? new Date(mail.date) : new Date(),
            status: 'INBOX',
          },
        },
        upsert: true,
      },
    }));

    await this.emailModel.bulkWrite(ops, { ordered: false });

    await Promise.all(
      emails.map((mail) =>
        this.aiService.embedEmailIfNeeded(
          {
            emailId: mail.id,
            subject: mail.subject,
            snippet: mail.snippet,
            from: mail.from,
          },
          userId,
          'INBOX',
          EmbeddingLevel.SUMMARY,
        ),
      ),
    );
  }

  async mergeStatuses(
    userId: string,
    emails: {
      id: string;
      from: string;
      subject: string;
      snippet: string;
      date: string;
    }[],
  ) {
    await this.unsnoozeExpired(userId);
    const ids = emails.map((e) => e.id);
    const existing = await this.emailModel
      .find({ userId, emailId: { $in: ids } })
      .lean();
    const existingMap = new Map(existing.map((e) => [e.emailId, e]));

    const ops: AnyBulkWriteOperation<EmailEntity>[] = [];
    emails.forEach((mail) => {
      if (!existingMap.has(mail.id)) {
        ops.push({
          insertOne: {
            document: {
              emailId: mail.id,
              userId,
              sender: mail.from,
              subject: mail.subject,
              snippet: mail.snippet ?? '',
              receivedAt: mail.date ? new Date(mail.date) : new Date(),
              status: 'INBOX',
            },
          },
        });
      }
    });
    if (ops.length) {
      await this.emailModel.bulkWrite(ops);
    }

    const refreshed = await this.emailModel
      .find({ userId, emailId: { $in: ids } })
      .lean();
    const refreshedMap = new Map(refreshed.map((e) => [e.emailId, e.status]));

    return emails.map((mail) => ({
      ...mail,
      status: refreshedMap.get(mail.id) || 'INBOX',
    }));
  }

  async getCachedSummary(emailId: string, userId: string) {
    const doc = await this.emailModel
      .findOne({ userId, emailId })
      .select('summary fullText status')
      .lean();
    if (!doc || (!doc.summary && !doc.fullText)) return null;
    return {
      summary: doc.summary,
      fullText: doc.fullText,
      status: doc.status as EmailStatus,
    };
  }

  async saveSummary(
    emailId: string,
    userId: string,
    summary: string,
    fullText: string,
    detail: {
      from: string;
      subject?: string;
      snippet?: string;
      date?: string;
      status?: EmailStatus;
    },
  ) {
    await this.emailModel.updateOne(
      { userId, emailId },
      {
        $set: { summary, fullText },
        $setOnInsert: {
          sender: detail.from,
          subject: detail.subject,
          snippet: detail.snippet ?? '',
          receivedAt: detail.date ? new Date(detail.date) : new Date(),
          status: detail.status || 'INBOX',
        },
      },
      { upsert: true },
    );
  }

  async updateStatus(
    userId: string,
    emailId: string,
    status: EmailStatus,
    options?: { snoozedUntil?: string | Date; previousStatus?: EmailStatus },
  ) {
    await this.unsnoozeExpired(userId);
    if (status === 'SNOOZED') {
      const until = options?.snoozedUntil
        ? new Date(options.snoozedUntil)
        : new Date(Date.now() + 4 * 60 * 60 * 1000);
      const existing = await this.emailModel
        .findOne({ userId, emailId })
        .lean();
      const prevStatus =
        options?.previousStatus ||
        existing?.status ||
        existing?.previousStatus ||
        'INBOX';

      await this.emailModel.updateOne(
        { userId, emailId },
        {
          $set: {
            status: 'SNOOZED',
            snoozedUntil: until,
            previousStatus: prevStatus,
          },
        },
        { upsert: true },
      );
      return {
        message: 'Status updated',
        status: 'SNOOZED',
        snoozedUntil: until,
      };
    }

    await this.emailModel.updateOne(
      { userId, emailId },
      {
        $set: {
          status,
        },
        $unset: { snoozedUntil: '', previousStatus: '' },
      },
      { upsert: true },
    );
    return { message: 'Status updated', status };
  }
}
