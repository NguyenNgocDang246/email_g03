import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { EmailDetailMapper } from 'src/mappers';
import { InjectModel } from '@nestjs/mongoose';
import { EmailEntity, EmailStatus } from './email.schema';
import { Model, type AnyBulkWriteOperation } from 'mongoose';

@Injectable()
export class EmailsService {
  constructor(
    private authService: AuthService,
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
      emailDetailMapped.status = 'INBOX';
    } else {
      emailDetailMapped.status = statusDoc.status as EmailStatus;
    }

    return emailDetailMapped;
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

  async updateStatus(userId: string, emailId: string, status: EmailStatus) {
    await this.emailModel.updateOne(
      { userId, emailId },
      {
        $set: {
          status,
        },
      },
      { upsert: true },
    );
    return { message: 'Status updated', status };
  }
}
