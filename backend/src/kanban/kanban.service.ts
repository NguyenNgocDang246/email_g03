import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { KANBAN_LABELS } from './kanban.constants';

@Injectable()
export class KanbanService {
  constructor(private readonly authService: AuthService) {}

  async ensureKanbanLabels(userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const existing = await gmail.users.labels.list({ userId: 'me' });
    const existingNames =
      existing.data.labels?.map((l) => l.name?.toUpperCase()) ?? [];

    for (const label of KANBAN_LABELS) {
      if (!existingNames.includes(label.name)) {
        await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: label.name,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
      }
    }
  }
}
