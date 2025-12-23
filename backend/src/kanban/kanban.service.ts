import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import {
  DEFAULT_KANBAN_COLUMNS,
  MAX_KANBAN_COLUMNS,
  SNOOZED_COLUMN_NAME,
} from './kanban.constants';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KanbanColumn,
  KanbanColumnDocument,
} from './schemas/kanban-column.schema';
import { EmailEntity } from '../emails/schemas/email.schema';

@Injectable()
export class KanbanService {
  constructor(
    private readonly authService: AuthService,
    @InjectModel(KanbanColumn.name)
    private readonly columnModel: Model<KanbanColumnDocument>,
    @InjectModel(EmailEntity.name)
    private readonly emailModel: Model<EmailEntity>,
  ) {}

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, '_').toUpperCase();
  }

  private normalizeDisplayName(displayName: string) {
    return displayName.trim();
  }

  private async ensureDefaultColumns(userId: string) {
    const existing = await this.columnModel
      .find({
        userId,
        name: { $in: DEFAULT_KANBAN_COLUMNS.map((c) => c.name) },
      })
      .select('name')
      .lean();
    const existingNames = new Set(existing.map((col) => col.name));
    const missing = DEFAULT_KANBAN_COLUMNS.filter(
      (col) => !existingNames.has(col.name),
    );

    if (missing.length) {
      try {
        await this.columnModel.insertMany(
          missing.map((col) => ({
            ...col,
            userId,
          })),
          { ordered: false },
        );
      } catch (error) {
        if (error?.code !== 11000) {
          throw error;
        }
      }
    }

    await this.columnModel.updateMany(
      { userId, name: { $in: ['INBOX', SNOOZED_COLUMN_NAME] } },
      { $set: { isLocked: true } },
    );
  }

  async getColumns(userId: string) {
    await this.ensureDefaultColumns(userId);
    return this.columnModel
      .find({ userId })
      .sort({ position: 1, createdAt: 1 })
      .lean();
  }

  async createColumn(userId: string, payload: { name?: string; displayName?: string }) {
    await this.ensureDefaultColumns(userId);
    const rawName = payload?.name?.trim();
    if (!rawName) {
      throw new BadRequestException('Column name is required');
    }

    const name = this.normalizeName(rawName);
    let displayName = payload?.displayName
      ? this.normalizeDisplayName(payload.displayName)
      : rawName;
    if (!displayName) {
      displayName = rawName;
    }

    if (name === 'INBOX' || name === SNOOZED_COLUMN_NAME) {
      throw new BadRequestException('Column name is reserved');
    }

    const count = await this.columnModel.countDocuments({ userId });
    if (count >= MAX_KANBAN_COLUMNS) {
      throw new BadRequestException('Max kanban columns reached');
    }

    const existing = await this.columnModel.findOne({ userId, name }).lean();
    if (existing) {
      throw new BadRequestException('Column name already exists');
    }

    const last = await this.columnModel
      .findOne({ userId })
      .sort({ position: -1 })
      .select('position')
      .lean();
    const position = last?.position ?? 0;

    const created = await this.columnModel.create({
      userId,
      name,
      displayName,
      position: position + 1,
      isLocked: false,
    });

    await this.ensureKanbanLabels(userId);
    return created;
  }

  async updateColumn(
    userId: string,
    columnId: string,
    payload: { name?: string; displayName?: string },
  ) {
    const column = await this.columnModel.findOne({ _id: columnId, userId });
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const isReserved =
      column.isLocked ||
      column.name === 'INBOX' ||
      column.name === SNOOZED_COLUMN_NAME;
    if (isReserved && payload?.name) {
      throw new BadRequestException('Column is locked');
    }

    let nextName = column.name;
    if (payload?.name) {
      const normalizedName = this.normalizeName(payload.name);
      if (normalizedName === 'INBOX' || normalizedName === SNOOZED_COLUMN_NAME) {
        throw new BadRequestException('Column name is reserved');
      }
      if (normalizedName !== column.name) {
        const existing = await this.columnModel
          .findOne({ userId, name: normalizedName })
          .lean();
        if (existing) {
          throw new BadRequestException('Column name already exists');
        }
        nextName = normalizedName;
      }
    }

    if (payload?.displayName) {
      const nextDisplayName = this.normalizeDisplayName(payload.displayName);
      if (!nextDisplayName) {
        throw new BadRequestException('Display name cannot be empty');
      }
      column.displayName = nextDisplayName;
    }
    if (nextName !== column.name) {
      const previousName = column.name;
      column.name = nextName;
      await this.emailModel.updateMany(
        { userId, status: previousName },
        { $set: { status: nextName } },
      );
      await this.emailModel.updateMany(
        { userId, status: 'SNOOZED', previousStatus: previousName },
        { $set: { previousStatus: nextName } },
      );
    }

    await column.save();
    await this.ensureKanbanLabels(userId);
    return column;
  }

  async deleteColumn(userId: string, columnId: string) {
    const column = await this.columnModel.findOne({ _id: columnId, userId });
    if (!column) {
      throw new NotFoundException('Column not found');
    }
    if (
      column.isLocked ||
      column.name === 'INBOX' ||
      column.name === SNOOZED_COLUMN_NAME
    ) {
      throw new BadRequestException('Cannot delete reserved column');
    }

    await this.columnModel.deleteOne({ _id: columnId });
    await this.emailModel.updateMany(
      { userId, status: column.name },
      { $set: { status: 'INBOX' } },
    );
    await this.emailModel.updateMany(
      { userId, status: 'SNOOZED', previousStatus: column.name },
      { $set: { previousStatus: 'INBOX' } },
    );

    return { message: 'Column deleted' };
  }

  async ensureKanbanLabels(userId: string) {
    const gmail = await this.authService.getGmail(userId);
    if (!gmail) return null;

    const columns = await this.getColumns(userId);
    const existing = await gmail.users.labels.list({ userId: 'me' });
    const existingNames =
      existing.data.labels?.map((l) => l.name?.toUpperCase()) ?? [];

    for (const column of columns) {
      if (!existingNames.includes(column.name)) {
        await gmail.users.labels.create({
          userId: 'me',
          requestBody: {
            name: column.name,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
      }
    }
  }
}
