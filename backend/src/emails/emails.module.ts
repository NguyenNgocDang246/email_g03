import {
  forwardRef,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { KanbanModule } from '../kanban/kanban.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { TokenModule } from '../token/token.module';
import { EmailEmbeddingsService } from './email-embeddings.service';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import {
  EmailEmbeddingEntity,
  EmailEmbeddingSchema,
} from './schemas/email-embedding.schema';
import { EmailEntity, EmailSchema } from './schemas/email.schema';

@Module({
  imports: [
    TokenModule,
    AuthModule,
    KanbanModule,
    MongooseModule.forFeature([
      { name: EmailEntity.name, schema: EmailSchema },
      { name: EmailEmbeddingEntity.name, schema: EmailEmbeddingSchema },
    ]),
    forwardRef(() => AiModule),
  ],
  controllers: [EmailsController],
  providers: [EmailsService, EmailEmbeddingsService],
  exports: [EmailsService, EmailEmbeddingsService],
})
export class EmailsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/emails');
  }
}
