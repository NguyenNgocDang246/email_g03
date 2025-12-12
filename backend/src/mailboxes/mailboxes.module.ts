import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MailboxesController } from './mailboxes.controller';
import { MailboxesService } from './mailboxes.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { TokenModule } from '../token/token.module';
import { EmailsModule } from '../emails/emails.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TokenModule, AuthModule, EmailsModule],
  controllers: [MailboxesController],
  providers: [MailboxesService],
  exports: [MailboxesService],
})
export class MailboxesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/mailboxes');
  }
}
