import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { TokenModule } from 'src/token/token.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { KanbanModule } from 'src/kanban/kanban.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailEntity, EmailSchema } from './email.schema';

@Module({
  imports: [
    TokenModule,
    AuthModule,
    KanbanModule,
    MongooseModule.forFeature([{ name: EmailEntity.name, schema: EmailSchema }]),
  ],
  controllers: [EmailsController],
  providers: [EmailsService],
  exports: [EmailsService],
})
export class EmailsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/emails');
  }
}
