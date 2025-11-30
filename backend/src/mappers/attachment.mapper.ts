import { gmail_v1 } from 'googleapis';
import { Attachment } from 'src/types';

export class AttachmentMapper {
  static fromPart(
    part: gmail_v1.Schema$MessagePart | undefined,
    messageId?: string,
  ): Attachment | null {
    if (!part) return null;

    // Only parts with a filename are considered attachments
    const fileName = part.filename ?? '';
    if (!fileName || fileName.length === 0) return null;

    const mimeType = part.mimeType ?? 'application/octet-stream';
    const attachmentId = part.body?.attachmentId;
    const size = Number(part.body?.size ?? 0);

    // Compose an id for the attachment. Prefer the actual attachmentId
    const id = attachmentId ?? `${messageId ?? 'unknown'}:${fileName}`;

    // Prefer a direct Gmail API attachment download URL when we have both ids.
    // This can be used directly by a client authorized to call Gmail API,
    // or later proxied by the backend.
    let downloadUrl = '';
    if (attachmentId && messageId) {
      downloadUrl = `https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`;
    } else if (attachmentId) {
      downloadUrl = `/gmail/attachments/${attachmentId}`; // fallback/proxy hint
    }

    return {
      id,
      fileName,
      mimeType,
      size,
      downloadUrl,
    } as Attachment;
  }

  static fromParts(
    parts: gmail_v1.Schema$MessagePart[] | undefined,
    messageId?: string,
  ): Attachment[] {
    if (!parts) return [];

    const attachments: Attachment[] = [];

    const walk = (
      p?: gmail_v1.Schema$MessagePart | gmail_v1.Schema$MessagePart[],
    ) => {
      if (!p) return;
      if (Array.isArray(p)) return p.forEach((pp) => walk(pp));

      // If this part has a filename, treat as attachment
      const a = AttachmentMapper.fromPart(p, messageId);
      if (a) attachments.push(a);

      // Otherwise walk nested parts
      if (p.parts && p.parts.length > 0) walk(p.parts);
    };

    walk(parts);
    return attachments;
  }
}
