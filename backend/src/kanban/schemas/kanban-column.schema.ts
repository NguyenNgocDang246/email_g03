import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KanbanColumnDocument = KanbanColumn & Document;

@Schema({ timestamps: true })
export class KanbanColumn {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  displayName: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true })
  position: number;

  @Prop({ default: false })
  isLocked: boolean;
}

export const KanbanColumnSchema = SchemaFactory.createForClass(KanbanColumn);

KanbanColumnSchema.index({ userId: 1, name: 1 }, { unique: true });
KanbanColumnSchema.index({ userId: 1, position: 1 });
