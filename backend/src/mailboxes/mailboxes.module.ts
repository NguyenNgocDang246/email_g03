import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MailboxesController } from './mailboxes.controller';
import { MailboxesService } from './mailboxes.service';
import { AuthMiddleware } from 'src/middleware/auth.middleware';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [TokenModule],
  controllers: [MailboxesController],
  providers: [MailboxesService],
})
export class MailboxesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/mailboxes');
  }
}
