import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TokenModule } from '../token/token.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { EmailEntity, EmailSchema } from '../emails/schemas/email.schema';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
import {
  KanbanColumn,
  KanbanColumnSchema,
} from './schemas/kanban-column.schema';

@Module({
  imports: [
    TokenModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: KanbanColumn.name, schema: KanbanColumnSchema },
      { name: EmailEntity.name, schema: EmailSchema },
    ]),
  ],
  controllers: [KanbanController],
  providers: [KanbanService],
  exports: [KanbanService],
})
export class KanbanModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/kanban');
  }
}
