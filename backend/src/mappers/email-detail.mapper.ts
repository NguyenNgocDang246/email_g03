import { gmail_v1 } from 'googleapis';
import { EmailDetail } from 'src/types';
import { AttachmentMapper } from './attachment.mapper';
import { GmailMapper } from './email.mapper';

export class EmailDetailMapper {
  static toEmailDetail(
    fullMsg: gmail_v1.Schema$Message,
    mailboxId?: string,
  ): EmailDetail {
    const payload = fullMsg.payload;

    // Start from the basic email fields
    const base = GmailMapper.toEmail(fullMsg, mailboxId ?? '');

    const decodeBase64Url = (data?: string) => {
      if (!data) return '';
      // Gmail returns base64url, convert to base64
      const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
      try {
        return Buffer.from(b64, 'base64').toString('utf-8');
      } catch (e) {
        return '';
      }
    };

    let bodyHtml: string | undefined;
    let bodyText: string | undefined;

    const walk = (
      part?: gmail_v1.Schema$MessagePart | gmail_v1.Schema$MessagePart[],
    ) => {
      if (!part) return;
      if (Array.isArray(part)) return part.forEach((p) => walk(p));

      const p = part as gmail_v1.Schema$MessagePart;
      const mime = p.mimeType ?? '';

      if (mime.includes('text/html') && !bodyHtml) {
        bodyHtml = decodeBase64Url(p.body?.data ?? undefined) || undefined;
      } else if (mime.includes('text/plain') && !bodyText) {
        bodyText = decodeBase64Url(p.body?.data ?? undefined) || undefined;
      }

      if (p.parts && p.parts.length) walk(p.parts);
    };

    // Check top-level payload body first
    if (payload?.body?.data) {
      const topMime = payload.mimeType ?? '';
      if (topMime.includes('html'))
        bodyHtml = decodeBase64Url(payload.body.data);
      else if (topMime.includes('plain'))
        bodyText = decodeBase64Url(payload.body.data);
    }

    // Walk parts to find html/text bodies
    if (payload?.parts) walk(payload.parts);

    const messageId = typeof fullMsg.id === 'string' ? fullMsg.id : undefined;
    const attachments = AttachmentMapper.fromParts(payload?.parts, messageId);

    return {
      ...base,
      bodyHtml: bodyHtml || undefined,
      bodyText: bodyText || undefined,
      attachments: attachments.length ? attachments : undefined,
    };
  }
}
