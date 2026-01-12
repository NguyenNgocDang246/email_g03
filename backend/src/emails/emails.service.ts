import {
  forwardRef,
  Inject,
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EmailEntity, EmailStatus } from './schemas/email.schema';
import { Model, type AnyBulkWriteOperation } from 'mongoose';
import { AuthService } from '../auth/auth.service';
import { EmailDetailMapper, GmailMapper } from '../mappers';
import { AiService } from '../ai/ai.service';
import { EmbeddingLevel } from './schemas/email-embedding.schema';
import { KanbanService } from '../kanban/kanban.service';

@Injectable()
export class EmailsService {
  constructor(
    private authService: AuthService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    private kanbanService: KanbanService,
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
        labels: emailDetailMapped.labels ?? [],
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
        isRead: !(storedMap.get(id)?.labels || []).includes('UNREAD'),
        labels: storedMap.get(id)?.labels || [],
        status: (storedMap.get(id)?.status as any) || 'INBOX',
        hasAttachments: storedMap.get(id)?.hasAttachments || false,
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
      hasAttachments: m.hasAttachments || false,
    }));
  }

  buildMimeEmail(to: string, subject: string, html: string, files: any[] = []) {
    if (!files || files.length === 0) {
      // Simple email without attachments
      const mime = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        html,
      ].join('\n');

      return Buffer.from(mime)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    // Multipart email with attachments
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    const mimeParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ];

    // Add attachments
    files.forEach((file) => {
      const fileContent = file.buffer.toString('base64');
      mimeParts.push(
        `--${boundary}`,
        `Content-Type: ${file.mimetype}; name="${file.originalname}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${file.originalname}"`,
        '',
        fileContent,
      );
    });

    mimeParts.push(`--${boundary}--`);

    const mime = mimeParts.join('\n');
    return Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async sendEmail(userId: string, { to, subject, html }, files: any[] = []) {
    const raw = this.buildMimeEmail(to, subject, html, files);
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

  buildReplyMime({ to, subject, html, messageIdHeader, referencesHeader, files = [] }: { to: string; subject: string; html: string; messageIdHeader: string; referencesHeader?: string; files?: any[] }) {
    let references = messageIdHeader;
    if (referencesHeader && referencesHeader.trim().length) {
      references = referencesHeader.trim() + ' ' + messageIdHeader;
    }

    if (!files || files.length === 0) {
      // Simple reply without attachments
      const mime = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `In-Reply-To: ${messageIdHeader}`,
        `References: ${references}`,
        'Content-Type: text/html; charset="UTF-8"',
        '',
        html,
      ].join('\n');

      return Buffer.from(mime)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    // Multipart reply with attachments
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36)}`;
    const mimeParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${references}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
    ];

    // Add attachments
    files.forEach((file) => {
      const fileContent = file.buffer.toString('base64');
      mimeParts.push(
        `--${boundary}`,
        `Content-Type: ${file.mimetype}; name="${file.originalname}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${file.originalname}"`,
        '',
        fileContent,
      );
    });

    mimeParts.push(`--${boundary}--`);

    const mime = mimeParts.join('\n');
    return Buffer.from(mime)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  async replyEmail(
    userId: string,
    { to, subject, html },
    threadId: string,
    messageIdHeader: string,
    referencesHeader?: string,
    files: any[] = [],
  ) {
    const raw = this.buildReplyMime({
      to,
      subject,
      html,
      messageIdHeader,
      referencesHeader,
      files,
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
      labels?: string[];
      hasAttachments?: boolean;
      mailboxId?: string;
    }[],
    mailboxId?: string,
  ) {
    if (!emails.length) return;

    const ops: AnyBulkWriteOperation<EmailEntity>[] = emails.map((mail) => ({
      updateOne: {
        filter: { userId, emailId: mail.id },
        update: {
          $set: {
            sender: mail.from,
            subject: mail.subject,
            snippet: mail.snippet ?? '',
            receivedAt: mail.date ? new Date(mail.date) : new Date(),
            labels: mail.labels ?? [],
            hasAttachments: mail.hasAttachments,
          },
          $setOnInsert: {
            emailId: mail.id,
            userId,
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
          mailboxId || mail.mailboxId || 'INBOX',
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
      hasAttachments?: boolean;
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
              hasAttachments: mail.hasAttachments || false,
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
    const refreshedMap = new Map(
      refreshed.map((e) => [e.emailId, { status: e.status, hasAttachments: e.hasAttachments }]),
    );

    return emails.map((mail) => {
      const stored = refreshedMap.get(mail.id);
      return {
        ...mail,
        status: stored?.status || 'INBOX',
        hasAttachments: mail.hasAttachments ?? stored?.hasAttachments ?? false,
      };
    });
  }

  async getCachedSummary(emailId: string, userId: string) {
    const doc = await this.emailModel
      .findOne({ userId, emailId })
      .select('summary fullText status sender subject receivedAt labels')
      .lean();
    if (!doc || (!doc.summary && !doc.fullText)) return null;
    return {
      summary: doc.summary,
      fullText: doc.fullText,
      status: doc.status as EmailStatus,
      sender: doc.sender,
      subject: doc.subject,
      receivedAt: doc.receivedAt,
      labels: doc.labels ?? [],
    };
  }

  async getCachedEmailMetadata(emailId: string, userId: string) {
    const doc = await this.emailModel
      .findOne({ userId, emailId })
      .select('sender subject receivedAt labels status')
      .lean();
    if (!doc) return null;
    return {
      sender: doc.sender,
      subject: doc.subject,
      receivedAt: doc.receivedAt,
      labels: doc.labels ?? [],
      status: doc.status as EmailStatus,
    };
  }

  async refreshSnoozedStatuses(userId: string) {
    await this.unsnoozeExpired(userId);
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
    const normalizedStatus = (status || '').toString().trim().toUpperCase();
    if (!normalizedStatus) {
      throw new BadRequestException('Status is required');
    }

    const columns = await this.kanbanService.getColumns(userId);
    const allowedStatuses = new Set(columns.map((col) => col.name));
    if (!allowedStatuses.has(normalizedStatus)) {
      throw new BadRequestException('Invalid kanban status');
    }

    if (normalizedStatus === 'SNOOZED') {
      const until = options?.snoozedUntil
        ? new Date(options.snoozedUntil)
        : new Date(Date.now() + 4 * 60 * 60 * 1000);
      const existing = await this.emailModel
        .findOne({ userId, emailId })
        .lean();
      const rawPrevStatus =
        options?.previousStatus ||
        existing?.status ||
        existing?.previousStatus ||
        'INBOX';
      const prevStatus = rawPrevStatus.toString().trim().toUpperCase();
      const nextPreviousStatus = allowedStatuses.has(prevStatus)
        ? prevStatus
        : 'INBOX';

      await this.emailModel.updateOne(
        { userId, emailId },
        {
          $set: {
            status: 'SNOOZED',
            snoozedUntil: until,
            previousStatus: nextPreviousStatus,
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
          status: normalizedStatus,
        },
        $unset: { snoozedUntil: '', previousStatus: '' },
      },
      { upsert: true },
    );
    return { message: 'Status updated', status: normalizedStatus };
  }
}
