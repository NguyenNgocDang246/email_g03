import { gmail_v1 } from 'googleapis';
import { Email } from 'src/types';

export class GmailMapper {
  static toEmail(fullMsg: gmail_v1.Schema$Message, mailboxId: string): Email {
    const payload = fullMsg.payload;
    const headers = payload?.headers ?? [];

    const getHeader = (name: string): string | undefined => {
      const h = headers.find(
        (h) =>
          typeof h.name === 'string' &&
          h.name.toLowerCase() === name.toLowerCase(),
      );
      const val = h?.value;
      return val == null ? undefined : val;
    };

    const from = getHeader('From') || '';
    const subject = getHeader('Subject') || '';

    const parseAddressList = (value?: string) => {
      if (!value) return [] as { name?: string; email: string }[];
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((entry) => {
          // Match formats like: Name <email@domain> or "Name" <email@domain>
          const m = entry.match(
            /^(?:"?([^"<>]+)"?\s*)?<([^<>@\s]+@[^<>\s]+)>$/,
          );
          if (m) return { name: m[1]?.trim(), email: m[2].trim() };
          // fallback: try to extract an email address
          const emailOnly = entry.match(/([^<>\s,]+@[^<>\s,]+)/);
          return { email: emailOnly ? emailOnly[1].trim() : entry };
        });
    };

    const toList = parseAddressList(getHeader('To'));
    const ccList = parseAddressList(getHeader('Cc'));
    const bccList = parseAddressList(getHeader('Bcc'));

    const fromAddr = parseAddressList(from)[0];
    const fromName = fromAddr?.name;
    const fromEmail = fromAddr?.email || from.replace(/[<>]/g, '').trim();

    const hasAttachments = (() => {
      const checkPart = (
        part?: gmail_v1.Schema$MessagePart | gmail_v1.Schema$MessagePart[],
      ): boolean => {
        if (!part) return false;
        if (Array.isArray(part)) return part.some((p) => checkPart(p));
        if (
          (part as gmail_v1.Schema$MessagePart).filename &&
          (part as gmail_v1.Schema$MessagePart).filename!.length > 0
        )
          return true;
        if ((part as gmail_v1.Schema$MessagePart).parts)
          return checkPart((part as gmail_v1.Schema$MessagePart).parts);
        return false;
      };
      return checkPart(payload?.parts) || false;
    })();

    // Normalize date to ISO string when possible
    const dateHeader = getHeader('Date');
    let date = '';
    if (dateHeader) {
      const parsed = new Date(dateHeader);
      if (!isNaN(parsed.getTime())) date = parsed.toISOString();
    }
    if (!date && fullMsg.internalDate) {
      const ms = Number(fullMsg.internalDate);
      if (!isNaN(ms)) date = new Date(ms).toISOString();
      else date = String(fullMsg.internalDate);
    }

    return {
      id: fullMsg.id!,
      threadId: fullMsg.threadId!,
      mailboxId,
      from: fromEmail,
      fromName,
      to: toList.map((t) => t.email),
      cc: ccList.length ? ccList.map((c) => c.email) : undefined,
      bcc: bccList.length ? bccList.map((b) => b.email) : undefined,
      subject,
      snippet: fullMsg.snippet ?? '',
      date,
      isRead: !(fullMsg.labelIds || []).includes('UNREAD'),
      hasAttachments,
      labels: fullMsg.labelIds ?? [],
      fromAvatar: undefined,
    };
  }
}
